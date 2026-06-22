const db = require('../database');

// Helpers for Promise-based DB queries
const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

// Create a new order
exports.createOrder = async (req, res) => {
  const { date, location, salary, allowance, order_type, notes } = req.body;
  const userId = req.user.id;

  if (!date || !location || salary === undefined || allowance === undefined || !order_type) {
    return res.status(400).json({ message: 'Date, Location, Salary, Allowance and Order Type are required.' });
  }

  const parsedSalary = parseFloat(salary);
  const parsedAllowance = parseFloat(allowance);

  if (isNaN(parsedSalary) || isNaN(parsedAllowance)) {
    return res.status(400).json({ message: 'Salary and Allowance must be numbers.' });
  }

  try {
    const result = await dbRun(
      'INSERT INTO orders (user_id, date, location, salary, allowance, order_type, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, date, location, parsedSalary, parsedAllowance, order_type, notes || '']
    );

    const newOrder = {
      id: result.lastID,
      user_id: userId,
      date,
      location,
      salary: parsedSalary,
      allowance: parsedAllowance,
      order_type,
      notes: notes || '',
    };

    res.status(201).json({ message: 'Order record added successfully.', order: newOrder });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error creating order.' });
  }
};

// Get all orders (with Search, Filters, and Pagination)
exports.getOrders = async (req, res) => {
  const userId = req.user.id;
  const { search, filterType, startDate, endDate, page = 1, limit = 10 } = req.query;

  const parsedPage = parseInt(page);
  const parsedLimit = parseInt(limit);
  const offset = (parsedPage - 1) * parsedLimit;

  let query = 'SELECT * FROM orders WHERE user_id = ?';
  let params = [userId];

  // 1. Search by Location
  if (search) {
    query += ' AND location LIKE ?';
    params.push(`%${search}%`);
  }

  // 2. Filter by Date
  if (filterType) {
    const today = new Date();
    // Helper to format Date to YYYY-MM-DD in local time
    const formatLocalDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (filterType === 'today') {
      const todayStr = formatLocalDate(today);
      query += ' AND date = ?';
      params.push(todayStr);
    } else if (filterType === 'week') {
      // Current week (Monday to Sunday)
      const currentDay = today.getDay(); // 0 is Sun, 1 is Mon...
      const distanceToMon = currentDay === 0 ? -6 : 1 - currentDay;
      const monday = new Date(today);
      monday.setDate(today.getDate() + distanceToMon);
      
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      query += ' AND date BETWEEN ? AND ?';
      params.push(formatLocalDate(monday), formatLocalDate(sunday));
    } else if (filterType === 'month') {
      // Current month
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      query += ' AND date BETWEEN ? AND ?';
      params.push(formatLocalDate(firstDay), formatLocalDate(lastDay));
    } else if (filterType === 'custom' && startDate && endDate) {
      query += ' AND date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }
  }

  try {
    // Get total count for pagination before applying LIMIT/OFFSET
    const countQuery = `SELECT COUNT(*) as total FROM (${query})`;
    const countResult = await dbGet(countQuery, params);
    const totalRecords = countResult ? countResult.total : 0;
    const totalPages = Math.ceil(totalRecords / parsedLimit);

    // Apply sorting & pagination
    query += ' ORDER BY date DESC, id DESC LIMIT ? OFFSET ?';
    params.push(parsedLimit, offset);

    const orders = await dbAll(query, params);

    res.status(200).json({
      orders,
      pagination: {
        totalRecords,
        totalPages,
        currentPage: parsedPage,
        limit: parsedLimit,
      },
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error retrieving orders.' });
  }
};

// Update an order
exports.updateOrder = async (req, res) => {
  const { id } = req.params;
  const { date, location, salary, allowance, order_type, notes } = req.body;
  const userId = req.user.id;

  if (!date || !location || salary === undefined || allowance === undefined || !order_type) {
    return res.status(400).json({ message: 'Date, Location, Salary, Allowance and Order Type are required.' });
  }

  const parsedSalary = parseFloat(salary);
  const parsedAllowance = parseFloat(allowance);

  if (isNaN(parsedSalary) || isNaN(parsedAllowance)) {
    return res.status(400).json({ message: 'Salary and Allowance must be numbers.' });
  }

  try {
    // Check ownership
    const order = await dbGet('SELECT * FROM orders WHERE id = ? AND user_id = ?', [id, userId]);
    if (!order) {
      return res.status(404).json({ message: 'Order not found or access denied.' });
    }

    await dbRun(
      'UPDATE orders SET date = ?, location = ?, salary = ?, allowance = ?, order_type = ?, notes = ? WHERE id = ? AND user_id = ?',
      [date, location, parsedSalary, parsedAllowance, order_type, notes || '', id, userId]
    );

    const updatedOrder = {
      id: parseInt(id),
      user_id: userId,
      date,
      location,
      salary: parsedSalary,
      allowance: parsedAllowance,
      order_type,
      notes: notes || '',
    };

    res.status(200).json({ message: 'Order record updated successfully.', order: updatedOrder });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ message: 'Server error updating order.' });
  }
};

// Delete an order
exports.deleteOrder = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // Check ownership
    const order = await dbGet('SELECT * FROM orders WHERE id = ? AND user_id = ?', [id, userId]);
    if (!order) {
      return res.status(404).json({ message: 'Order not found or access denied.' });
    }

    await dbRun('DELETE FROM orders WHERE id = ? AND user_id = ?', [id, userId]);

    res.status(200).json({ message: 'Order record deleted successfully.' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ message: 'Server error deleting order.' });
  }
};

// Get stats
exports.getStats = async (req, res) => {
  const userId = req.user.id;

  // Formatting date to SQLite YYYY-MM-DD
  const today = new Date();
  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatLocalDate(today);

  // Week start and end
  const currentDay = today.getDay();
  const distanceToMon = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(today);
  monday.setDate(today.getDate() + distanceToMon);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const weekStartStr = formatLocalDate(monday);
  const weekEndStr = formatLocalDate(sunday);

  // Month start and end
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const monthStartStr = formatLocalDate(monthStart);
  const monthEndStr = formatLocalDate(monthEnd);

  try {
    // 1. Total lifetime counts & values
    const lifetimeStats = await dbGet(
      'SELECT COUNT(*) as count, SUM(salary) as totalSalary, SUM(allowance) as totalAllowance FROM orders WHERE user_id = ?',
      [userId]
    );

    // 2. Today's stats
    const todayStats = await dbGet(
      'SELECT COUNT(*) as count, SUM(salary) as totalSalary, SUM(allowance) as totalAllowance FROM orders WHERE user_id = ? AND date = ?',
      [userId, todayStr]
    );

    // 3. Weekly stats
    const weeklyStats = await dbGet(
      'SELECT COUNT(*) as count, SUM(salary) as totalSalary, SUM(allowance) as totalAllowance FROM orders WHERE user_id = ? AND date BETWEEN ? AND ?',
      [userId, weekStartStr, weekEndStr]
    );

    // 4. Monthly stats
    const monthlyStats = await dbGet(
      'SELECT COUNT(*) as count, SUM(salary) as totalSalary, SUM(allowance) as totalAllowance FROM orders WHERE user_id = ? AND date BETWEEN ? AND ?',
      [userId, monthStartStr, monthEndStr]
    );

    // 5. Daily trend chart data (last 14 active days with order entries)
    const dailyTrend = await dbAll(
      `SELECT date, SUM(salary) as totalSalary, SUM(allowance) as totalAllowance 
       FROM orders 
       WHERE user_id = ? 
       GROUP BY date 
       ORDER BY date DESC 
       LIMIT 14`,
      [userId]
    );
    // Reverse to chronological order for charts
    dailyTrend.reverse();

    // 6. Monthly trend chart data (grouped by Year-Month for current year)
    const currentYear = today.getFullYear();
    const monthlyTrend = await dbAll(
      `SELECT strftime('%Y-%m', date) as month, SUM(salary) as totalSalary, SUM(allowance) as totalAllowance 
       FROM orders 
       WHERE user_id = ? AND strftime('%Y', date) = ? 
       GROUP BY month 
       ORDER BY month ASC`,
      [userId, String(currentYear)]
    );

    // 7. Order type breakdown (for custom delivery insights)
    const typeBreakdown = await dbAll(
      `SELECT order_type, COUNT(*) as count, SUM(salary + allowance) as totalEarnings 
       FROM orders 
       WHERE user_id = ? 
       GROUP BY order_type`,
      [userId]
    );

    // Prepare response object
    const cleanStat = (stat) => ({
      count: stat ? stat.count : 0,
      totalSalary: stat && stat.totalSalary ? parseFloat(stat.totalSalary) : 0,
      totalAllowance: stat && stat.totalAllowance ? parseFloat(stat.totalAllowance) : 0,
      totalIncome: stat && stat.totalSalary ? (parseFloat(stat.totalSalary) + parseFloat(stat.totalAllowance)) : 0,
    });

    res.status(200).json({
      lifetime: cleanStat(lifetimeStats),
      today: cleanStat(todayStats),
      weekly: cleanStat(weeklyStats),
      monthly: cleanStat(monthlyStats),
      dailyTrend: dailyTrend.map(d => ({
        date: d.date,
        salary: d.totalSalary || 0,
        allowance: d.totalAllowance || 0,
        total: (d.totalSalary || 0) + (d.totalAllowance || 0),
      })),
      monthlyTrend: monthlyTrend.map(m => ({
        month: m.month,
        salary: m.totalSalary || 0,
        allowance: m.totalAllowance || 0,
        total: (m.totalSalary || 0) + (m.totalAllowance || 0),
      })),
      typeBreakdown: typeBreakdown.map(t => ({
        order_type: t.order_type,
        count: t.count,
        totalEarnings: t.totalEarnings || 0,
      })),
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ message: 'Server error retrieving statistics.' });
  }
};
