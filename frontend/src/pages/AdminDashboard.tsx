import { Users, TrendingUp, ShoppingBag, DollarSign, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

interface OrderItem {
  quantity: number;
  food: { name: string; price: number; image_url: string | null };
}

interface Order {
  id: number;
  order_number: string;
  total_amount: string;
  status: string;
  created_at: string;
  user?: { name: string };
  items: OrderItem[];
}

export default function AdminDashboard() {
  const { data: orders, isLoading: loadingOrders } = useQuery({
    queryKey: ['adminOrders'],
    queryFn: async () => {
      const res = await api.get('/orders');
      return res.data as Order[];
    },
    refetchInterval: 30000,
  });

  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data as any[];
    },
    refetchInterval: 30000,
  });

  if (loadingOrders || loadingUsers) {
    return <div className="flex items-center justify-center h-full min-h-[50vh]"><Loader2 className="w-10 h-10 animate-spin text-orange-500" /></div>;
  }

  // Calculate Stats
  const deliveredOrders = orders?.filter(o => o.status === 'delivered') || [];
  const totalRevenue = deliveredOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
  
  const today = new Date().toISOString().split('T')[0];
  const ordersToday = orders?.filter(o => o.created_at.startsWith(today)).length || 0;
  
  const customersCount = users?.length || 0;

  const stats = [
    { label: 'Total Revenue', value: `₦${totalRevenue.toLocaleString()}`, icon: DollarSign, trend: '+12.5%' },
    { label: 'Orders Today', value: ordersToday.toString(), icon: ShoppingBag, trend: '+8.2%' },
    { label: 'Active Customers', value: customersCount.toString(), icon: Users, trend: '+4.1%' },
    { label: 'Avg. Delivery Time', value: '24 mins', icon: TrendingUp, trend: '-2.5%' },
  ];

  // Calculate Top Meals
  const mealSales: Record<string, { count: number, price: number, image: string | null }> = {};
  orders?.forEach(order => {
    order.items.forEach(item => {
      if (item.food) {
        if (!mealSales[item.food.name]) {
          mealSales[item.food.name] = { count: 0, price: item.food.price, image: item.food.image_url };
        }
        mealSales[item.food.name].count += item.quantity;
      }
    });
  });

  const topMeals = Object.entries(mealSales)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([name, data]) => ({ name, sales: data.count, price: data.price, image: data.image }));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          const isPositive = stat.trend.startsWith('+');
          return (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <span className={`text-sm font-bold px-2 py-1 rounded-full ${isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                  {stat.trend}
                </span>
              </div>
              <h3 className="text-gray-500 text-sm font-medium">{stat.label}</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
            </motion.div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Orders</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="text-gray-500 text-sm border-b border-gray-100">
                  <th className="pb-3 font-medium px-2">Order ID</th>
                  <th className="pb-3 font-medium px-2">Customer</th>
                  <th className="pb-3 font-medium px-2">Amount</th>
                  <th className="pb-3 font-medium px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders?.slice(0, 6).map(order => (
                  <tr key={order.id}>
                    <td className="py-4 px-2 font-bold text-gray-900">{order.order_number}</td>
                    <td className="py-4 px-2 text-gray-600">{order.user?.name || 'Guest'}</td>
                    <td className="py-4 px-2 font-bold text-orange-600">₦{Number(order.total_amount).toLocaleString()}</td>
                    <td className="py-4 px-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        order.status === 'delivered' ? 'bg-green-50 text-green-600' : 
                        order.status === 'cancelled' ? 'bg-red-50 text-red-600' : 
                        'bg-blue-50 text-blue-600'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Top Selling Meals</h3>
          <div className="space-y-6">
            {topMeals.length === 0 ? (
              <p className="text-gray-500 text-sm">No sales data yet.</p>
            ) : topMeals.map(meal => (
              <div key={meal.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                    {meal.image ? <img src={meal.image} alt={meal.name} className="w-full h-full object-cover" /> : '🍲'}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm line-clamp-1 max-w-[150px]">{meal.name}</p>
                    <p className="text-xs text-gray-500">{meal.sales} orders</p>
                  </div>
                </div>
                <span className="font-bold text-orange-600 text-sm">₦{Number(meal.price).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
