// server/src/controllers/admin/support.controller.ts
import { Request, Response } from 'express';
import SupportTicket from '../../models/support/SupportTicket';
import MessageSupport from '../../models/MessageSupport';
import { parseListQuery } from '../../utils/query';

export const getSupportTickets = async (req: Request, res: Response) => {
  try {
    const { filters, page, perPage } = parseListQuery(req.query);

    // Build query
    const query: any = {};

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by assignee
    if (req.query.assignee) {
      query.assignee = req.query.assignee;
    }

    // Filter by priority
    if (req.query.priority) {
      query.priority = req.query.priority;
    }

    // Filter by group
    if (req.query.group) {
      query.group = req.query.group;
    }

    // Date range filter
    if (req.query.from || req.query.to) {
      query.createdAt = {};
      if (req.query.from) {
        query.createdAt.$gte = new Date(req.query.from as string);
      }
      if (req.query.to) {
        query.createdAt.$lte = new Date(req.query.to as string);
      }
    }

    // Text search
    if (req.query.q) {
      query.$text = { $search: req.query.q as string };
    }

    const skip = (page - 1) * perPage;
    const total = await SupportTicket.countDocuments(query);
    const tickets = await SupportTicket.find(query)
      .populate('requester', 'userId')
      .populate('assignee', 'name email')
      .populate('links.orderId', 'orderNumber')
      .populate('links.store', 'name')
      .populate('links.driver', 'name')
      .sort(filters.sort)
      .skip(skip)
      .limit(perPage);

    // Get message counts for each ticket
    const ticketsWithCounts = await Promise.all(
      tickets.map(async (ticket) => {
        const messageCount = await MessageSupport.countDocuments({ ticketId: ticket._id });
        const firstResponseTime = await MessageSupport.findOne(
          { ticketId: ticket._id, sender: { $ne: 'user' } },
          { createdAt: 1 },
          { sort: { createdAt: 1 } }
        );

        return {
          ...ticket.toObject(),
          messageCount,
          firstResponseTime: firstResponseTime?.createdAt,
          responseTime: firstResponseTime ?
            Math.floor((firstResponseTime.createdAt.getTime() - ticket.createdAt.getTime()) / (1000 * 60)) :
            null, // minutes
        };
      })
    );

    res.json({
      tickets: ticketsWithCounts,
      pagination: {
        page,
        limit: perPage,
        total,
        pages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getSupportTicket = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const ticket = await SupportTicket.findById(id)
      .populate('requester', 'userId')
      .populate('assignee', 'name email')
      .populate('links.orderId', 'orderNumber')
      .populate('links.store', 'name')
      .populate('links.driver', 'name');

    if (!ticket) {
       res.status(404).json({ message: 'Ticket not found' });
       return;
    }

    // Get messages for this ticket
    const messages = await MessageSupport.find({ ticketId: id })
      .sort({ createdAt: 1 })
      .limit(100);

    res.json({
      ticket,
      messages: messages.map(msg => ({
        _id: msg._id,
        sender: msg.sender,
        text: msg.text,
        createdAt: msg.createdAt,
        attachments: msg.attachments || [],
      })),
    });
  } catch (error) {
    console.error('Error fetching support ticket:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createSupportTicket = async (req: Request, res: Response) => {
  try {
    const {
      subject,
      description,
      priority = 'normal',
      assignee,
      group,
      tags = [],
      links = {},
    } = req.body;

    // Generate ticket number
    const lastTicket = await SupportTicket.findOne({}, {}, { sort: { number: -1 } });
    const ticketNumber = lastTicket ? lastTicket.number + 1 : 1;

    const ticket = new SupportTicket({
      number: ticketNumber,
      subject,
      description,
      priority,
      assignee,
      group,
      tags,
      links,
      status: 'new',
      source: 'admin',
    });

    await ticket.save();
    await ticket.populate('requester assignee links.orderId links.store links.driver');

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Error creating support ticket:', error);
    if (error.name === 'ValidationError') {
       res.status(400).json({ message: error.message });
       return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateSupportTicket = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const ticket = await SupportTicket.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('requester', 'userId')
      .populate('assignee', 'name email')
      .populate('links.orderId', 'orderNumber')
      .populate('links.store', 'name')
      .populate('links.driver', 'name');

    if (!ticket) {
       res.status(404).json({ message: 'Ticket not found' });
       return;
    }

    res.json(ticket);
  } catch (error) {
    console.error('Error updating support ticket:', error);
    if (error.name === 'ValidationError') {
       res.status(400).json({ message: error.message });
       return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const assignSupportTicket = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { assignee, group } = req.body;

    const updates: any = {};
    if (assignee) updates.assignee = assignee;
    if (group) updates.group = group;

    const ticket = await SupportTicket.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('requester', 'userId')
      .populate('assignee', 'name email');

    if (!ticket) {
         res.status(404).json({ message: 'Ticket not found' });
       return;
    }

    res.json(ticket);
  } catch (error) {
    console.error('Error assigning support ticket:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const addSupportMessage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { text, sender = 'agent', attachments = [] } = req.body;

    const message = new MessageSupport({
      ticketId: id,
      sender,
      text,
      attachments,
    });

    await message.save();

    // Update ticket's last message time
    await SupportTicket.findByIdAndUpdate(id, {
      $set: { lastMessageAt: new Date() }
    });

    // Check if this is first response
    const existingMessages = await MessageSupport.countDocuments({
      ticketId: id,
      sender: { $ne: 'user' }
    });

    if (existingMessages === 1) { // This is the first response
      await SupportTicket.findByIdAndUpdate(id, {
        $set: { firstResponseAt: new Date() }
      });
    }

    res.status(201).json({
      _id: message._id,
      sender: message.sender,
      text: message.text,
      createdAt: message.createdAt,
      attachments: message.attachments,
    });
  } catch (error) {
    console.error('Error adding support message:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getSupportStats = async (req: Request, res: Response) => {
  try {
    const query: any = {};

    // Apply filters
    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.assignee) {
      query.assignee = req.query.assignee;
    }

    if (req.query.from || req.query.to) {
      query.createdAt = {};
      if (req.query.from) {
        query.createdAt.$gte = new Date(req.query.from as string);
      }
      if (req.query.to) {
        query.createdAt.$lte = new Date(req.query.to as string);
      }
    }

    const stats = await SupportTicket.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalTickets: { $sum: 1 },
          newTickets: { $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] } },
          openTickets: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
          pendingTickets: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          resolvedTickets: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          closedTickets: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
          averageFirstResponseTime: { $avg: '$firstResponseAt' },
          averageResolutionTime: { $avg: '$resolvedAt' },
          breachedFirstResponse: { $sum: { $cond: ['$breachFirstResponse', 1, 0] } },
          breachedResolution: { $sum: { $cond: ['$breachResolve', 1, 0] } },
        }
      }
    ]);

    const result = stats[0] || {
      totalTickets: 0,
      newTickets: 0,
      openTickets: 0,
      pendingTickets: 0,
      resolvedTickets: 0,
      closedTickets: 0,
      averageFirstResponseTime: 0,
      averageResolutionTime: 0,
      breachedFirstResponse: 0,
      breachedResolution: 0,
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching support stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
