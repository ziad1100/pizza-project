import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import Order from '../models/Order';
import Product from '../models/Product';
import User from '../models/User';
import Analytics from '../models/Analytics';
import Notification from '../models/Notification';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { generateOrderNo } from '../utils';
import type { AuthRequest } from '../middlewares/auth';
import { validateCoupon } from '../services/coupon.service';
import { sendOrderConfirmation } from '../services/email.service';
import { ORDER_STATUS, PAYMENT_METHODS } from '../constants';
import { getSettingsMap } from '../models/Setting';

interface OrderItemInput {
  product: string;
  size?: string | null;
  extras?: { name: string; price: number }[];
  qty: number;
}

export const createOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { items: rawItems, couponCode, address, phone, notes, paymentMethod } = req.body;
  const userId = req.user!.id;
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new ApiError(400, 'Order must contain at least one item');
  }
  if (!address || !phone) throw new ApiError(400, 'Delivery address and phone are required');

  const items = rawItems as OrderItemInput[];
  const productIds = items.map((i) => i.product);
  const products = await Product.find({ _id: { $in: productIds } }).lean();
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  let subtotal = 0;
  const orderItems = items.map((item) => {
    const product = productMap.get(String(item.product));
    if (!product) throw new ApiError(404, 'Product not found in order');
    const size = product.sizes.find((s) => String(s._id) === String(item.size));
    const unitPrice = size?.price ?? product.basePrice;
    const extrasTotal = (item.extras ?? []).reduce((acc, e) => acc + (Number(e.price) || 0), 0);
    const lineTotal = (unitPrice + extrasTotal) * Math.max(1, item.qty);
    subtotal += lineTotal;
    return {
      product: product._id,
      name: product.name,
      size: size?.name ?? '',
      extras: item.extras ?? [],
      qty: Math.max(1, item.qty),
      unitPrice: unitPrice + extrasTotal,
      lineTotal,
    };
  });

  const settings = await getSettingsMap();
  const defaultFee = Number((settings.deliveryFee as number) ?? 25);
  const minOrder = Number((settings.minimumOrder as number) ?? 100);
  const freeDeliveryOver = Number((settings.freeDeliveryOver as number) ?? 0);

  if (subtotal < minOrder) {
    throw new ApiError(400, `Minimum order is ${minOrder} EGP`);
  }
  let deliveryFee = defaultFee;
  if (freeDeliveryOver > 0 && subtotal >= freeDeliveryOver) {
    deliveryFee = 0;
  }

  let discount = 0;
  if (couponCode) {
    const validated = await validateCoupon(couponCode, userId, subtotal);
    discount = validated.amount;
  }

  const total = Math.max(0, subtotal + deliveryFee - discount);

  const orderNo = await generateOrderNo();
  const payment = {
    method: Object.values(PAYMENT_METHODS).includes(paymentMethod) ? paymentMethod : PAYMENT_METHODS.CASH,
    status: paymentMethod === PAYMENT_METHODS.CARD ? 'pending' : 'pending',
    amount: total,
  };

  const order = await Order.create({
    orderNo,
    user: new Types.ObjectId(userId),
    items: orderItems,
    subtotal,
    deliveryFee,
    discount,
    couponCode: couponCode?.toUpperCase() ?? '',
    total,
    payment,
    status: ORDER_STATUS.PENDING,
    deliveryAddress: address,
    phone,
    customerName: req.body.customerName || 'عميل',
    notes,
    statusHistory: [{ status: ORDER_STATUS.PENDING, changedBy: new Types.ObjectId(userId), at: new Date() }],
  });

  const senderEmail = (await User.findById(userId).select('email').lean())?.email ?? '';
  void sendOrderConfirmation(senderEmail, orderNo, total).catch(() => undefined);

  const today = new Date().toISOString().slice(0, 10);
  await Analytics.updateOne(
    { date: today },
    {
      $inc: { revenue: total, orders: 1 },
    },
    { upsert: true },
  );

  res.status(201).json(new ApiResponse(201, order, 'Order created successfully'));
});

export const cancelOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user!.id });
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.status !== ORDER_STATUS.PENDING) {
    throw new ApiError(400, 'Only pending orders can be cancelled');
  }
  order.status = ORDER_STATUS.CANCELLED;
  order.statusHistory?.push({ status: ORDER_STATUS.CANCELLED, changedBy: new Types.ObjectId(req.user!.id) });
  await order.save();
  res.json(new ApiResponse(200, order, 'Order cancelled'));
});

export const updateStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  if (!Object.values(ORDER_STATUS).includes(status)) throw new ApiError(400, 'Invalid status');
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status, $push: { statusHistory: { status, changedBy: new Types.ObjectId(req.user!.id), at: new Date() } } },
    { new: true },
  );
  if (!order) throw new ApiError(404, 'Order not found');
  await Notification.create({
    user: order.user,
    title: `حالة الطلب ${order.orderNo}`,
    titleEn: `Order ${order.orderNo} status`,
    body: `تم تحديث حالة طلبك إلى ${status}`,
    bodyEn: `Your order status is now ${status}`,
    type: 'order',
    link: `/account/orders/${order._id}`,
  });
  res.json(new ApiResponse(200, order, 'Order status updated'));
});

export const history = asyncHandler(async (req: AuthRequest, res: Response) => {
  const orders = await Order.find({ user: req.user!.id }).sort('-createdAt').lean();
  res.json(new ApiResponse(200, orders));
});

export const adminList = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const status = String(req.query.status || '');
  const q = String(req.query.q || '');
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (q) {
    filter.$or = [
      { orderNo: { $regex: q, $options: 'i' } },
      { customerName: { $regex: q, $options: 'i' } },
      { phone: { $regex: q, $options: 'i' } },
    ];
  }
  const [items, total] = await Promise.all([
    Order.find(filter).populate('user', 'fullName email phone').sort('-createdAt').skip((page - 1) * limit).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);
  res.json(new ApiResponse(200, { items, total, page, pages: Math.ceil(total / limit) }));
});

export const stats = asyncHandler(async (_req: Request, res: Response) => {
  const [total, orders, revenueAgg, pending] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([{ $match: { status: { $ne: ORDER_STATUS.CANCELLED } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Order.countDocuments({ status: ORDER_STATUS.PENDING }),
  ]);
  res.json(
    new ApiResponse(200, {
      totalOrders: total,
      completedOrders: orders,
      revenue: revenueAgg[0]?.total ?? 0,
      pendingOrders: pending,
    }),
  );
});