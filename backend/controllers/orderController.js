const supabase = require('../database');

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
    const { data: newOrder, error } = await supabase
      .from('orders')
      .insert([{
        user_id: userId,
        date,
        location,
        salary: parsedSalary,
        allowance: parsedAllowance,
        order_type,
        notes: notes || '',
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Order record added successfully.', order: newOrder });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error creating order.', error: error.message });
  }
};

// Get all orders (with Search, Filters, and Pagination)
exports.getOrders = async (req, res) => {
  const userId = req.user.id;
  const { search, filterType, startDate, endDate, page = 1, limit = 10 } = req.query;

  const parsedPage = parseInt(page);
  const parsedLimit = parseInt(limit);
  const offset = (parsedPage - 1) * parsedLimit;

  try {
    let queryBuilder = supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    // 1. Search by Location
    if (search) {
      queryBuilder = queryBuilder.ilike('location', `%${search}%`);
    }

    // 2. Filter by Date
    if (filterType) {
      const today = new Date();
      const formatLocalDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      if (filterType === 'today') {
        const todayStr = formatLocalDate(today);
        queryBuilder = queryBuilder.eq('date', todayStr);
      } else if (filterType === 'week') {
        const currentDay = today.getDay();
        const distanceToMon = currentDay === 0 ? -6 : 1 - currentDay;
        const monday = new Date(today);
        monday.setDate(today.getDate() + distanceToMon);
        
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        queryBuilder = queryBuilder.gte('date', formatLocalDate(monday)).lte('date', formatLocalDate(sunday));
      } else if (filterType === 'month') {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        queryBuilder = queryBuilder.gte('date', formatLocalDate(firstDay)).lte('date', formatLocalDate(lastDay));
      } else if (filterType === 'custom' && startDate && endDate) {
        queryBuilder = queryBuilder.gte('date', startDate).lte('date', endDate);
      }
    }

    // Apply sorting & pagination
    const { data: orders, count, error } = await queryBuilder
      .order('date', { ascending: false })
      .order('id', { ascending: false })
      .range(offset, offset + parsedLimit - 1);

    if (error) throw error;

    const totalRecords = count || 0;
    const totalPages = Math.ceil(totalRecords / parsedLimit);

    res.status(200).json({
      orders: orders || [],
      pagination: {
        totalRecords,
        totalPages,
        currentPage: parsedPage,
        limit: parsedLimit,
      },
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error retrieving orders.', error: error.message });
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
    const { data: order, error: findError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (findError) throw findError;
    if (!order) {
      return res.status(404).json({ message: 'Order not found or access denied.' });
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        date,
        location,
        salary: parsedSalary,
        allowance: parsedAllowance,
        order_type,
        notes: notes || '',
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) throw updateError;

    res.status(200).json({ message: 'Order record updated successfully.', order: updatedOrder });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ message: 'Server error updating order.', error: error.message });
  }
};

// Delete an order
exports.deleteOrder = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // Check ownership
    const { data: order, error: findError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (findError) throw findError;
    if (!order) {
      return res.status(404).json({ message: 'Order not found or access denied.' });
    }

    const { error: deleteError } = await supabase
      .from('orders')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (deleteError) throw deleteError;

    res.status(200).json({ message: 'Order record deleted successfully.' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ message: 'Server error deleting order.', error: error.message });
  }
};

// Get stats
exports.getStats = async (req, res) => {
  const userId = req.user.id;

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
    // Fetch all orders for the user to aggregate statistics in-memory
    const { data: orders, error } = await supabase
      .from('orders')
      .select('date, salary, allowance, order_type')
      .eq('user_id', userId);

    if (error) throw error;

    let lifetime = { count: 0, totalSalary: 0, totalAllowance: 0 };
    let todayStats = { count: 0, totalSalary: 0, totalAllowance: 0 };
    let weekly = { count: 0, totalSalary: 0, totalAllowance: 0 };
    let monthly = { count: 0, totalSalary: 0, totalAllowance: 0 };

    const dailyTrendMap = {};
    const monthlyTrendMap = {};
    const typeBreakdownMap = {};

    (orders || []).forEach(order => {
      const salary = parseFloat(order.salary) || 0;
      const allowance = parseFloat(order.allowance) || 0;
      const date = order.date; // YYYY-MM-DD
      const type = order.order_type;

      // 1. Lifetime
      lifetime.count++;
      lifetime.totalSalary += salary;
      lifetime.totalAllowance += allowance;

      // 2. Today
      if (date === todayStr) {
        todayStats.count++;
        todayStats.totalSalary += salary;
        todayStats.totalAllowance += allowance;
      }

      // 3. Weekly
      if (date >= weekStartStr && date <= weekEndStr) {
        weekly.count++;
        weekly.totalSalary += salary;
        weekly.totalAllowance += allowance;
      }

      // 4. Monthly
      if (date >= monthStartStr && date <= monthEndStr) {
        monthly.count++;
        monthly.totalSalary += salary;
        monthly.totalAllowance += allowance;
      }

      // 5. Daily Trend
      if (date) {
        if (!dailyTrendMap[date]) {
          dailyTrendMap[date] = { salary: 0, allowance: 0 };
        }
        dailyTrendMap[date].salary += salary;
        dailyTrendMap[date].allowance += allowance;
      }

      // 6. Monthly Trend (current year)
      if (date && date.startsWith(String(today.getFullYear()))) {
        const yyyyMm = date.substring(0, 7); // YYYY-MM
        if (!monthlyTrendMap[yyyyMm]) {
          monthlyTrendMap[yyyyMm] = { salary: 0, allowance: 0 };
        }
        monthlyTrendMap[yyyyMm].salary += salary;
        monthlyTrendMap[yyyyMm].allowance += allowance;
      }

      // 7. Type breakdown
      if (type) {
        if (!typeBreakdownMap[type]) {
          typeBreakdownMap[type] = { count: 0, totalEarnings: 0 };
        }
        typeBreakdownMap[type].count++;
        typeBreakdownMap[type].totalEarnings += (salary + allowance);
      }
    });

    // Convert dailyTrendMap to sorted array (last 14 active days)
    const dailyTrend = Object.keys(dailyTrendMap)
      .sort()
      .slice(-14)
      .map(d => ({
        date: d,
        salary: dailyTrendMap[d].salary,
        allowance: dailyTrendMap[d].allowance,
        total: dailyTrendMap[d].salary + dailyTrendMap[d].allowance,
      }));

    // Convert monthlyTrendMap to sorted array
    const monthlyTrend = Object.keys(monthlyTrendMap)
      .sort()
      .map(m => ({
        month: m,
        salary: monthlyTrendMap[m].salary,
        allowance: monthlyTrendMap[m].allowance,
        total: monthlyTrendMap[m].salary + monthlyTrendMap[m].allowance,
      }));

    // Convert typeBreakdownMap to array
    const typeBreakdown = Object.keys(typeBreakdownMap).map(type => ({
      order_type: type,
      count: typeBreakdownMap[type].count,
      totalEarnings: typeBreakdownMap[type].totalEarnings,
    }));

    const cleanStat = (stat) => ({
      count: stat.count,
      totalSalary: stat.totalSalary,
      totalAllowance: stat.totalAllowance,
      totalIncome: stat.totalSalary + stat.totalAllowance,
    });

    res.status(200).json({
      lifetime: cleanStat(lifetime),
      today: cleanStat(todayStats),
      weekly: cleanStat(weekly),
      monthly: cleanStat(monthly),
      dailyTrend,
      monthlyTrend,
      typeBreakdown,
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ message: 'Server error retrieving statistics.', error: error.message });
  }
};
