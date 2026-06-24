import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Download, 
  Calendar, 
  MapPin, 
  DollarSign, 
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
  FileSpreadsheet
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Orders = () => {
  // Routing query param check
  const routeLocation = useLocation();

  // Orders and Pagination states
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Search & Filters states
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal control states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    location: '',
    salary: '',
    allowance: '',
    order_type: 'Normal Delivery',
    notes: '',
  });

  const { showToast } = useToast();

  // Load orders on filter or pagination changes
  useEffect(() => {
    fetchOrders();
  }, [page, limit, filterType, startDate, endDate]);

  // Handle opening Add Modal if redirected with query param ?add=true
  useEffect(() => {
    const params = new URLSearchParams(routeLocation.search);
    if (params.get('add') === 'true') {
      openAddModal();
    }
  }, [routeLocation]);

  // Fetch orders with current queries
  const fetchOrders = async () => {
    setLoading(true);
    try {
      let url = `/orders?page=${page}&limit=${limit}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      if (filterType) {
        url += `&filterType=${filterType}`;
        if (filterType === 'custom' && startDate && endDate) {
          url += `&startDate=${startDate}&endDate=${endDate}`;
        }
      }
      
      const res = await api.get(url);
      setOrders(res.data.orders);
      setTotalPages(res.data.pagination.totalPages);
      setTotalRecords(res.data.pagination.totalRecords);
    } catch (err) {
      console.error(err);
      showToast('Failed to retrieve delivery records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Run search when pressing enter or clicking search button
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleFilterTypeChange = (type) => {
    setFilterType(type);
    setPage(1);
    if (type !== 'custom') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Form control handlers
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const openAddModal = () => {
    setEditingOrder(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      location: 'Mill Road',
      salary: '',
      allowance: '',
      order_type: 'Normal Delivery',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (order) => {
    setEditingOrder(order);
    setFormData({
      date: order.date,
      location: order.location,
      salary: order.salary.toString(),
      allowance: order.allowance.toString(),
      order_type: order.order_type,
      notes: order.notes || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingOrder(null);
  };

  // Create / Update handler
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!formData.date || !formData.location || formData.salary === '' || formData.allowance === '') {
      showToast('All fields except notes are required.', 'warning');
      return;
    }

    const payload = {
      ...formData,
      salary: parseFloat(formData.salary),
      allowance: parseFloat(formData.allowance),
    };

    try {
      if (editingOrder) {
        // Edit mode
        await api.put(`/orders/${editingOrder.id}`, payload);
        showToast('Delivery record updated successfully.', 'success');
      } else {
        // Add mode
        await api.post('/orders', payload);
        showToast('Delivery record created successfully.', 'success');
      }
      closeModal();
      fetchOrders();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to save delivery record.', 'error');
    }
  };

  // Delete handler
  const handleDeleteOrder = async (id) => {
    if (!window.confirm('Are you sure you want to delete this delivery record?')) return;

    try {
      await api.delete(`/orders/${id}`);
      showToast('Delivery record deleted successfully.', 'success');
      fetchOrders();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete delivery record.', 'error');
    }
  };

  // Helper to calculate total
  const calculateTotal = (salary, allowance) => {
    return parseFloat(salary || 0) + parseFloat(allowance || 0);
  };

  // Export to CSV utility
  const handleExportCSV = async (exportAll = false) => {
    try {
      let url = '/orders?limit=10000'; // Get all relevant records
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (filterType) {
        url += `&filterType=${filterType}`;
        if (filterType === 'custom' && startDate && endDate) {
          url += `&startDate=${startDate}&endDate=${endDate}`;
        }
      }

      const res = await api.get(url);
      const recordsToExport = res.data.orders;

      if (recordsToExport.length === 0) {
        showToast('No records available to export.', 'warning');
        return;
      }

      // Headers
      const headers = ['Date', 'Location', 'Order Type', 'Salary (INR)', 'Allowance (INR)', 'Total (INR)', 'Notes'];
      
      // Rows
      const rows = recordsToExport.map(item => [
        item.date,
        `"${item.location.replace(/"/g, '""')}"`,
        item.order_type,
        item.salary,
        item.allowance,
        item.salary + item.allowance,
        `"${(item.notes || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = "\uFEFF" + [
        headers.join(','),
        ...rows.map(e => e.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const filename = `Uoojo_Salary_Report_${new Date().toISOString().split('T')[0]}.csv`;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast('CSV report downloaded successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to generate export file.', 'error');
    }
  };

  // Generate PDF report utility function
  const generatePDFReport = (records, reportTitle, filename) => {
    try {
      const doc = new jsPDF();
      
      // Header Band
      doc.setFillColor(79, 70, 229); // Primary Indigo color (#4f46e5)
      doc.rect(0, 0, 210, 40, 'F');
      
      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('UOOJO DELIVERY SALARY', 14, 18);
      
      // Subtitle
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(224, 231, 255); // Light indigo
      doc.text(reportTitle.toUpperCase(), 14, 28);
      
      // Generation Date
      const todayStr = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.setFontSize(9);
      doc.setTextColor(224, 231, 255);
      doc.text(`Generated: ${todayStr}`, 145, 18);
      
      // Calculations
      let totalSalary = 0;
      let totalAllowance = 0;
      records.forEach(item => {
        totalSalary += parseFloat(item.salary || 0);
        totalAllowance += parseFloat(item.allowance || 0);
      });
      const netEarnings = totalSalary + totalAllowance;
      
      // Stats Panels / Summary Grid
      // Total Deliveries
      doc.setFillColor(243, 244, 246); // Light slate-100
      doc.roundedRect(14, 46, 56, 24, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(31, 41, 55);
      doc.text(records.length.toString(), 18, 56);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(107, 114, 128);
      doc.text('Total Deliveries', 18, 64);
      
      // Total Salary
      doc.setFillColor(243, 244, 246);
      doc.roundedRect(77, 46, 56, 24, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(31, 41, 55);
      doc.text(`Rs. ${totalSalary.toFixed(2)}`, 81, 56);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(107, 114, 128);
      doc.text('Total Base Salary', 81, 64);
      
      // Net Earnings
      doc.setFillColor(236, 253, 245); // Light emerald-50
      doc.roundedRect(140, 46, 56, 24, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(5, 150, 105); // Emerald-600
      doc.text(`Rs. ${netEarnings.toFixed(2)}`, 144, 56);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(107, 114, 128);
      doc.text('Net Earnings', 144, 64);
      
      // AutoTable
      const tableColumn = ["Date", "Location", "Order Type", "Salary", "Allowance", "Total", "Notes"];
      const tableRows = records.map(item => [
        item.date,
        item.location,
        item.order_type,
        `Rs. ${parseFloat(item.salary).toFixed(2)}`,
        `Rs. ${parseFloat(item.allowance).toFixed(2)}`,
        `Rs. ${(parseFloat(item.salary) + parseFloat(item.allowance)).toFixed(2)}`,
        item.notes || '—'
      ]);
      
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 78,
        theme: 'striped',
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold',
          halign: 'left'
        },
        bodyStyles: {
          fontSize: 8.5,
          textColor: [55, 65, 81]
        },
        columnStyles: {
          0: { cellWidth: 22 }, // Date
          1: { cellWidth: 35 }, // Location
          2: { cellWidth: 30 }, // Order Type
          3: { cellWidth: 22 }, // Salary
          4: { cellWidth: 22 }, // Allowance
          5: { cellWidth: 22 }, // Total
          6: { cellWidth: 'auto' } // Notes
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251]
        },
        margin: { top: 78 },
        didDrawPage: (data) => {
          // Footer
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(156, 163, 175); // gray-400
          doc.text("Uoojo Salary Management System", 14, 287);
          doc.text(`Page ${pageCount}`, 196, 287, { align: 'right' });
        }
      });
      
      doc.save(filename);
      showToast('PDF downloaded successfully!', 'success');
    } catch (err) {
      console.error('PDF Generation Error:', err);
      showToast('Failed to generate PDF file.', 'error');
    }
  };

  // Export to PDF utility (using current filters)
  const handleExportPDF = async () => {
    try {
      let url = '/orders?limit=10000'; // Get all relevant records
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (filterType) {
        url += `&filterType=${filterType}`;
        if (filterType === 'custom' && startDate && endDate) {
          url += `&startDate=${startDate}&endDate=${endDate}`;
        }
      }

      const res = await api.get(url);
      const recordsToExport = res.data.orders;

      if (recordsToExport.length === 0) {
        showToast('No records available to export.', 'warning');
        return;
      }

      const filename = `Uoojo_Salary_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      generatePDFReport(recordsToExport, 'Earnings Export Report', filename);
    } catch (err) {
      console.error(err);
      showToast('Failed to generate PDF export.', 'error');
    }
  };

  // Download Monthly Report specifically (filters active month records and exports to PDF)
  const handleDownloadMonthlyReport = async () => {
    try {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

      // Fetch all records for the current month
      const url = `/orders?limit=10000&filterType=custom&startDate=${firstDay}&endDate=${lastDay}`;
      const res = await api.get(url);
      const records = res.data.orders;

      if (records.length === 0) {
        showToast('No records found for the current month.', 'warning');
        return;
      }

      const currentMonthStr = today.toLocaleString('default', { month: 'long', year: 'numeric' });
      const currentMonthFileStr = currentMonthStr.replace(' ', '_');
      const filename = `Uoojo_Monthly_Report_${currentMonthFileStr}.pdf`;
      
      generatePDFReport(records, `Monthly Report - ${currentMonthStr}`, filename);
    } catch (err) {
      console.error(err);
      showToast('Failed to download monthly report.', 'error');
    }
  };

  // Helper currency formatter
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(val);
  };

  const getBadgeClass = (type) => {
    if (type === 'Long Distance') return 'badge-long';
    if (type === 'Bonus Delivery') return 'badge-bonus';
    return 'badge-normal';
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Delivery Earnings</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage and filter your daily delivery orders.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={handleDownloadMonthlyReport}>
            <FileText size={18} style={{ color: '#ef4444' }} />
            <span>Monthly Report (PDF)</span>
          </button>
          <button className="btn btn-secondary" onClick={handleExportPDF}>
            <FileText size={18} style={{ color: '#6366f1' }} />
            <span>Export PDF</span>
          </button>
          <button className="btn btn-secondary" onClick={() => handleExportCSV(false)}>
            <FileSpreadsheet size={18} style={{ color: '#10b981' }} />
            <span>Export CSV</span>
          </button>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} />
            <span>Add Record</span>
          </button>
        </div>
      </div>

      {/* Search & Filters Panel */}
      <div className="glass-panel filters-panel">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-control"
            placeholder="Search by location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        {/* Date Filter Quick Actions */}
        <div className="filters-group">
          <button 
            className={`btn btn-secondary btn-sm ${filterType === '' ? 'btn-primary' : ''}`}
            onClick={() => handleFilterTypeChange('')}
            style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
          >
            All Time
          </button>
          <button 
            className={`btn btn-secondary btn-sm ${filterType === 'today' ? 'btn-primary' : ''}`}
            onClick={() => handleFilterTypeChange('today')}
            style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
          >
            Today
          </button>
          <button 
            className={`btn btn-secondary btn-sm ${filterType === 'week' ? 'btn-primary' : ''}`}
            onClick={() => handleFilterTypeChange('week')}
            style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
          >
            This Week
          </button>
          <button 
            className={`btn btn-secondary btn-sm ${filterType === 'month' ? 'btn-primary' : ''}`}
            onClick={() => handleFilterTypeChange('month')}
            style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
          >
            This Month
          </button>
          <button 
            className={`btn btn-secondary btn-sm ${filterType === 'custom' ? 'btn-primary' : ''}`}
            onClick={() => handleFilterTypeChange('custom')}
            style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
          >
            Custom Range
          </button>

          {/* Custom Date Range Selectors */}
          {filterType === 'custom' && (
            <div className="custom-range-inputs">
              <input
                type="date"
                className="form-control"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span style={{ color: 'var(--text-muted)' }}>to</span>
              <input
                type="date"
                className="form-control"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Orders Table Panel */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="stat-value" style={{ fontSize: '1.2rem' }}>Retrieving earnings records...</div>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
              No delivery records found matching your filters.
            </p>
            <button className="btn btn-primary" onClick={openAddModal}>Add New Record</button>
          </div>
        ) : (
          <>
            {/* Desktop View Table */}
            <div className="desktop-only">
              <div className="table-wrapper">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Location</th>
                      <th>Order Type</th>
                      <th>Salary</th>
                      <th>Allowance</th>
                      <th>Total</th>
                      <th>Notes</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                            <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                            <span>{order.date}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <MapPin size={14} style={{ color: 'var(--text-muted)' }} />
                            <span>{order.location}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${getBadgeClass(order.order_type)}`}>
                            {order.order_type}
                          </span>
                        </td>
                        <td>{formatCurrency(order.salary)}</td>
                        <td>{formatCurrency(order.allowance)}</td>
                        <td style={{ fontWeight: 700, color: 'var(--text-heading)' }}>
                          {formatCurrency(order.salary + order.allowance)}
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={order.notes}>
                          {order.notes || '—'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                            <button 
                              className="btn btn-secondary btn-icon" 
                              onClick={() => openEditModal(order)}
                              title="Edit Record"
                              aria-label="Edit record"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              className="btn btn-danger btn-icon" 
                              onClick={() => handleDeleteOrder(order.id)}
                              title="Delete Record"
                              aria-label="Delete record"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile View Cards */}
            <div className="mobile-only">
              <div className="mobile-record-list">
                {orders.map((order) => (
                  <div key={order.id} className="record-card glass-panel">
                    <div className="record-card-header">
                      <div className="record-date">
                        <Calendar size={14} />
                        <span>{order.date}</span>
                      </div>
                      <span className={`badge ${getBadgeClass(order.order_type)}`}>
                        {order.order_type}
                      </span>
                    </div>
                    
                    <div className="record-card-body">
                      <div className="record-location">
                        <MapPin size={14} />
                        <span>{order.location}</span>
                      </div>
                      
                      <div className="record-earnings">
                        <div className="earning-detail">
                          <span>Salary: {formatCurrency(order.salary)}</span>
                          <span>Allowance: {formatCurrency(order.allowance)}</span>
                        </div>
                        <div className="earning-total">
                          {formatCurrency(order.salary + order.allowance)}
                        </div>
                      </div>
                      
                      {order.notes && (
                        <div className="record-notes">
                          {order.notes}
                        </div>
                      )}
                    </div>
                    
                    <div className="record-card-actions">
                      <button 
                        className="btn btn-secondary btn-icon" 
                        onClick={() => openEditModal(order)}
                        title="Edit Record"
                        aria-label="Edit record"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', gap: '0.35rem' }}
                      >
                        <Edit2 size={12} />
                        <span>Edit</span>
                      </button>
                      <button 
                        className="btn btn-danger btn-icon" 
                        onClick={() => handleDeleteOrder(order.id)}
                        title="Delete Record"
                        aria-label="Delete record"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', gap: '0.35rem' }}
                      >
                        <Trash2 size={12} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="pagination-container">
              <div className="pagination-info">
                Showing <strong>{orders.length}</strong> of <strong>{totalRecords}</strong> records
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                {/* Limit Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Show:</span>
                  <select 
                    className="form-control" 
                    value={limit} 
                    onChange={(e) => { setLimit(parseInt(e.target.value)); setPage(1); }}
                    style={{ padding: '0.25rem 0.5rem', borderRadius: '6px' }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                {/* Prev / Next buttons */}
                <div className="pagination-buttons">
                  <button 
                    className="btn btn-secondary btn-icon" 
                    disabled={page === 1}
                    onClick={() => setPage(prev => prev - 1)}
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span style={{ display: 'flex', alignItems: 'center', padding: '0 0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
                    Page {page} of {totalPages}
                  </span>
                  <button 
                    className="btn btn-secondary btn-icon" 
                    disabled={page === totalPages || totalPages === 0}
                    onClick={() => setPage(prev => prev + 1)}
                    aria-label="Next page"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem' }}>{editingOrder ? 'Edit Delivery Record' : 'Add Delivery Record'}</h2>
              <button className="menu-toggle" onClick={closeModal} aria-label="Close modal">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                {/* Date */}
                <div className="form-group">
                  <label htmlFor="modal-date">Date</label>
                  <input
                    id="modal-date"
                    type="date"
                    name="date"
                    className="form-control"
                    value={formData.date}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                {/* Location */}
                <div className="form-group">
                  <label htmlFor="modal-location">Location</label>
                  <select
                    id="modal-location"
                    name="location"
                    className="form-control"
                    value={formData.location}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="Mill Road">Mill Road</option>
                    <option value="Pattakarai">Pattakarai</option>
                    <option value="Pillayanmanai">Pillayanmanai</option>
                    <option value="Moses Street">Moses Street</option>
                    <option value="Mukuperi">Mukuperi</option>
                    <option value="Alwar">Alwar</option>
                    <option value="Agapaikulam">Agapaikulam</option>
                    <option value="Nazareth">Nazareth</option>
                    <option value="Church Road">Church Road</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Order Type */}
                <div className="form-group">
                  <label htmlFor="modal-order-type">Order Type</label>
                  <select
                    id="modal-order-type"
                    name="order_type"
                    className="form-control"
                    value={formData.order_type}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="Normal Delivery">Normal Delivery</option>
                    <option value="Long Distance">Long Distance</option>
                    <option value="Bonus Delivery">Bonus Delivery</option>
                  </select>
                </div>

                {/* Salary & Allowance side by side */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="modal-salary">Salary Amount (INR)</label>
                    <input
                      id="modal-salary"
                      type="number"
                      name="salary"
                      step="0.01"
                      className="form-control"
                      placeholder="e.g., 40.00"
                      value={formData.salary}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="modal-allowance">Allowance (INR)</label>
                    <input
                      id="modal-allowance"
                      type="number"
                      name="allowance"
                      step="0.01"
                      className="form-control"
                      placeholder="e.g., 15.00"
                      value={formData.allowance}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                </div>

                {/* Computed Total Preview */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: 'var(--primary-glow)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.95rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--primary)' }}>Auto-Calculated Total:</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-heading)' }}>
                    {formatCurrency(calculateTotal(formData.salary, formData.allowance))}
                  </span>
                </div>

                {/* Notes */}
                <div className="form-group">
                  <label htmlFor="modal-notes">Notes (Optional)</label>
                  <textarea
                    id="modal-notes"
                    name="notes"
                    className="form-control"
                    placeholder="Add delivery particulars here..."
                    rows="3"
                    value={formData.notes}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingOrder ? 'Save Changes' : 'Add Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
