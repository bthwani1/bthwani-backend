// server/src/controllers/admin/drivers.leave.controller.ts
import { Request, Response } from 'express';
import { DriverLeaveRequest } from '../../models/drivers/leaveRequest.model';
import { parseListQuery } from '../../utils/query';

export const getDriverLeaveRequests = async (req: Request, res: Response) => {
  try {
    const { filters, page, perPage } = parseListQuery(req.query);

    // Build query
    const query: any = {};

    if (req.query.driver) {
      query.driver = req.query.driver;
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    const skip = (page - 1) * perPage;
    const total = await DriverLeaveRequest.countDocuments(query);
    const requests = await DriverLeaveRequest.find(query)
      .populate('driver', 'fullName phone vehicleType')
      .populate('approvedBy', 'fullName')
      .sort(filters.sort)
      .skip(skip)
      .limit(perPage);

    res.json({
      requests,
      total,
      page,
      pageSize: perPage,
    });
  } catch (error) {
    console.error('Error fetching driver leave requests:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getDriverLeaveRequest = async (req: Request, res: Response) => {
  try {
    const request = await DriverLeaveRequest.findById(req.params.id)
      .populate('driver', 'fullName phone vehicleType')
      .populate('approvedBy', 'fullName');

    if (!request) {
       res.status(404).json({ message: 'Leave request not found' });
       return;
    }

    res.json(request);
  } catch (error) {
    console.error('Error fetching driver leave request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createDriverLeaveRequest = async (req: Request, res: Response) => {
  try {
    const { driver, fromDate, toDate, reason } = req.body;

    const leaveRequest = new DriverLeaveRequest({
      driver,
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      reason,
      status: 'pending'
    });

    await leaveRequest.save();
    await leaveRequest.populate('driver', 'fullName phone vehicleType');

    res.status(201).json(leaveRequest);
  } catch (error) {
    console.error('Error creating driver leave request:', error);
    if (error.name === 'ValidationError') {
       res.status(400).json({ message: error.message });
       return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateDriverLeaveRequest = async (req: Request, res: Response) => {
  try {
    const { driver, fromDate, toDate, reason, status } = req.body;

    const updateData: any = {};
    if (driver) updateData.driver = driver;
    if (fromDate) updateData.fromDate = new Date(fromDate);
    if (toDate) updateData.toDate = new Date(toDate);
    if (reason !== undefined) updateData.reason = reason;
    if (status) updateData.status = status;

    const request = await DriverLeaveRequest.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('driver', 'fullName phone vehicleType')
      .populate('approvedBy', 'fullName');

    if (!request) {
       res.status(404).json({ message: 'Leave request not found' });
       return;
    }

    res.json(request);
  } catch (error) {
    console.error('Error updating driver leave request:', error);
    if (error.name === 'ValidationError') {
       res.status(400).json({ message: error.message });
       return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const approveDriverLeaveRequest = async (req: Request, res: Response) => {
  try {
    const request = await DriverLeaveRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: 'approved',
        approvedBy: (req as any).userData?._id,
        approvedAt: new Date()
      },
      { new: true, runValidators: true }
    )
      .populate('driver', 'fullName phone vehicleType')
      .populate('approvedBy', 'fullName');

    if (!request) {
       res.status(404).json({ message: 'Leave request not found' });
       return;
    }

    res.json(request);
  } catch (error) {
    console.error('Error approving driver leave request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const rejectDriverLeaveRequest = async (req: Request, res: Response) => {
  try {
    const request = await DriverLeaveRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: 'rejected',
        approvedBy: (req as any).userData?._id,
        approvedAt: new Date()
      },
      { new: true, runValidators: true }
    )
      .populate('driver', 'fullName phone vehicleType')
      .populate('approvedBy', 'fullName');

    if (!request) {
       res.status(404).json({ message: 'Leave request not found' });
       return;
    }

    res.json(request);
  } catch (error) {
    console.error('Error rejecting driver leave request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteDriverLeaveRequest = async (req: Request, res: Response) => {
  try {
    const request = await DriverLeaveRequest.findByIdAndDelete(req.params.id);

    if (!request) {
         res.status(404).json({ message: 'Leave request not found' });
       return;
    }

    res.json({ message: 'Leave request deleted successfully' });
  } catch (error) {
    console.error('Error deleting driver leave request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getLeaveRequestStats = async (req: Request, res: Response) => {
  try {
    const stats = await DriverLeaveRequest.aggregate([
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          pendingRequests: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          approvedRequests: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          rejectedRequests: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
          },
          averageDuration: {
            $avg: {
              $add: [
                { $divide: [{ $subtract: ['$toDate', '$fromDate'] }, 1000 * 60 * 60 * 24] },
                1
              ]
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalRequests: 0,
      pendingRequests: 0,
      approvedRequests: 0,
      rejectedRequests: 0,
      averageDuration: 0
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching leave request stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
