import { connectDB, disconnectDB } from '../database/connection';
import Order from '../models/Order';
import Review from '../models/Review';
import User from '../models/User';
import Wishlist from '../models/Wishlist';
import Cart from '../models/Cart';

const TEST_ORDER_NUMBERS = ['PH-597747-2112', 'PH-018673-6449'];

const main = async (): Promise<void> => {
  const listOnly = process.argv.includes('--list');
  await connectDB();
  try {
    const orders = await Order.find({ orderNo: { $in: TEST_ORDER_NUMBERS } }).lean();
    const reviews = await Review.find().sort('createdAt').lean();

    const report = (): void => {
      console.log('[cleanup] orders matching test numbers:', orders.length);
      for (const o of orders) {
        console.log(`  - ${o.orderNo} | ${String(o.user)} | ${o.status} | ${o.createdAt.toISOString()}`);
      }
      console.log('[cleanup] reviews:', reviews.length);
      for (const r of reviews) {
        console.log(`  - ${String(r.user)} | rating ${r.rating} | approved ${r.isApproved} | "${(r.comment || '').slice(0, 60)}" | ${r.createdAt.toISOString()}`);
      }
    };

    if (listOnly) {
      report();
      const [wishlists, carts] = await Promise.all([Wishlist.countDocuments(), Cart.countDocuments()]);
      console.log(`[cleanup] wishlist total: ${wishlists} | cart total: ${carts}`);
      const cartDocs = await Cart.find().lean();
      for (const c of cartDocs) {
        const user = await User.findById(c.user).select('email').lean();
        const items = Array.isArray(c.items) ? c.items.length : 0;
        console.log(`  cart user ${user?.email ?? String(c.user)} | items ${items}`);
      }
      console.log('[cleanup] dry run — nothing deleted');
      return;
    }

    const orderResult = await Order.deleteMany({ orderNo: { $in: TEST_ORDER_NUMBERS } });
    const remainingOrders = await Order.countDocuments();
    console.log(`[cleanup] deleted ${orderResult.deletedCount} test order(s): ${TEST_ORDER_NUMBERS.join(', ')}`);
    console.log(`[cleanup] ${remainingOrders} orders remaining`);
  } finally {
    await disconnectDB();
  }
};

main().catch((err) => {
  console.error('[cleanup] failed:', err);
  process.exit(1);
});
