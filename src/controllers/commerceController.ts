import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { commerceService } from '../services/commerceService';
import { AppError } from '../utils/errors';

export class CommerceController {
  async recordCartEvent(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Authenticated user not found', 401);
    }

    const { productId, productName, quantity } = req.body;
    const event = await commerceService.recordCartEvent({
      userId,
      productId,
      productName,
      quantity,
    });

    res.status(201).json({
      status: true,
      message: 'Cart event recorded',
      data: event,
    });
  }

  async acquireHold(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Authenticated user not found', 401);
    }

    const hold = await commerceService.acquireHold(userId, req.body.items || []);
    res.status(201).json({
      status: true,
      message: 'Checkout hold acquired',
      data: hold,
    });
  }

  async getMyHold(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Authenticated user not found', 401);
    }

    const hold = await commerceService.getHoldForUser(userId);
    res.json({
      status: true,
      message: 'Checkout hold retrieved',
      data: hold,
    });
  }

  async releaseMyHold(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Authenticated user not found', 401);
    }

    await commerceService.releaseHoldForUser(userId);
    res.json({
      status: true,
      message: 'Checkout hold released',
    });
  }

  async createOrder(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Authenticated user not found', 401);
    }

    const order = await commerceService.createOrder(userId, req.body);
    res.status(201).json({
      status: true,
      message: 'Order created successfully',
      data: order,
    });
  }

  async getMyOrders(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Authenticated user not found', 401);
    }

    const orders = await commerceService.getOrdersForUser(userId);
    res.json({
      status: true,
      message: 'Orders retrieved successfully',
      data: orders,
    });
  }

  async getAllOrders(req: AuthenticatedRequest, res: Response) {
    const orders = await commerceService.getAllOrders();
    res.json({
      status: true,
      message: 'All orders retrieved successfully',
      data: orders,
    });
  }

  async getAllCartEvents(req: AuthenticatedRequest, res: Response) {
    const events = await commerceService.getCartEvents();
    res.json({
      status: true,
      message: 'Cart events retrieved successfully',
      data: events,
    });
  }

  async getAllHolds(req: AuthenticatedRequest, res: Response) {
    const holds = await commerceService.getActiveHolds();
    res.json({
      status: true,
      message: 'Active holds retrieved successfully',
      data: holds,
    });
  }
}

export const commerceController = new CommerceController();
