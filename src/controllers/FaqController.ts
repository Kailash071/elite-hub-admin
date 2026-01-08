import type { Request, Response } from 'express';
import * as FaqService from '../services/faq.js';
import { redirectWithFlash } from './index.js';

export const index = async (req: Request, res: Response) => {
    try {
        res.render('modules/faq/index', {
            pageTitle: 'FAQs',
            pageDescription: 'Manage frequently asked questions',
            currentPage: 'faq',
            breadcrumbs: [
                { text: 'Dashboard', url: '/dashboard' },
                { text: 'FAQs', url: '/faqs' }
            ],
            title: 'FAQs',
            activeMenu: 'faq',
            error: req.flash("error"),
            success: req.flash("success")
        });
    } catch (error) {
        console.error('Error in faq index:', error);
        res.status(500).render('errors/500.njk');
    }
};

export const indexData = async (req: Request, res: Response) => {
    try {
        const { draw, start, length, search, order, columns, status } = req.body;
        const page = Math.floor(parseInt(start) / parseInt(length)) + 1;
        const limit = parseInt(length);

        const query: any = { isDeleted: false };
        if (search && search.value) {
            query.$or = [
                { question: { $regex: search.value, $options: 'i' } },
                { answer: { $regex: search.value, $options: 'i' } }
            ];
        }

        if (status) query.isActive = status === 'Active';

        const sort: any = {};
        if (order && order.length > 0) {
            const columnIndex = order[0].column;
            const dir = order[0].dir === 'asc' ? 1 : -1;
            const columnName = columns[columnIndex].name;

            if (['question', 'sortOrder', 'isActive'].includes(columnName)) {
                sort[columnName] = dir;
            } else {
                sort.sortOrder = 1;
            }
        } else {
            sort.sortOrder = 1;
        }

        const result = await FaqService.findFaqs(query, { page, limit, sort });

        res.json({
            draw: parseInt(draw) || 1,
            recordsTotal: await FaqService.countFaqs({ isDeleted: false }),
            recordsFiltered: result.total,
            data: result.faqs
        });
    } catch (error) {
        console.error('Error in faq indexData:', error);
        res.status(500).json({ error: 'Failed to fetch FAQ data' });
    }
};

export const create = async (req: Request, res: Response) => {
    try {
        const nextOrder = await FaqService.getNextSortOrder();
        res.render('modules/faq/form', {
            pageTitle: 'Add New FAQ',
            pageDescription: 'Create a new FAQ',
            currentPage: 'faq',
            breadcrumbs: [
                { text: 'Dashboard', url: '/dashboard' },
                { text: 'FAQs', url: '/faqs' },
                { text: 'Add FAQ', url: '/faqs/add' }
            ],
            title: 'Add New FAQ',
            activeMenu: 'faq',
            nextOrder,
            error: req.flash("error"),
            success: req.flash("success")
        });
    } catch (error) {
        console.error('Error rendering faq create form:', error);
        res.status(500).render('errors/500.njk');
    }
};

export const store = async (req: Request, res: Response) => {
    try {
        const { question, answer, sortOrder, isActive } = req.body;

        const desiredOrder = sortOrder ? parseInt(sortOrder) : await FaqService.getNextSortOrder();
        await FaqService.shiftOrdersForInsert(desiredOrder);

        await FaqService.createFaq({
            question,
            answer,
            sortOrder: desiredOrder,
            isActive: isActive === 'on'
        });

        req.flash('success', 'FAQ created successfully');
        return redirectWithFlash(req, res, '/faqs');
    } catch (error) {
        console.error('Error in faq store:', error);
        req.flash('error', 'Something went wrong');
        return redirectWithFlash(req, res, '/faqs/add');
    }
};

export const edit = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        if (!id) {
            req.flash('error', 'FAQ id is required');
            return res.redirect('/faqs');
        }
        const faq = await FaqService.findFaqById(id);

        if (!faq) {
            req.flash('error', 'FAQ not found');
            return res.redirect('/faqs');
        }

        res.render('modules/faq/form', {
            pageTitle: 'Edit FAQ',
            pageDescription: 'Edit FAQ details',
            currentPage: 'faq',
            breadcrumbs: [
                { text: 'Dashboard', url: '/dashboard' },
                { text: 'FAQs', url: '/faqs' },
                { text: 'Edit FAQ', url: `/faqs/${id}/edit` }
            ],
            title: 'Edit FAQ',
            faq,
            activeMenu: 'faq',
            error: req.flash("error"),
            success: req.flash("success")
        });
    } catch (error) {
        console.error('Error in faq edit:', error);
        res.status(500).render('errors/500.njk');
    }
};

export const update = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const { question, answer, sortOrder, isActive } = req.body;

        if (!id) {
            req.flash('error', 'FAQ id is required');
            return res.redirect('/faqs');
        }

        const currentFaq = await FaqService.findFaqById(id);

        if (!currentFaq) {
            req.flash('error', 'FAQ not found');
            return redirectWithFlash(req, res, '/faqs');
        }

        let newOrder = currentFaq.sortOrder;
        if (sortOrder) {
            newOrder = parseInt(sortOrder);
        }
        await FaqService.reorderOnUpdate(id, newOrder, currentFaq.sortOrder);

        await FaqService.updateFaqById(id, {
            question,
            answer,
            sortOrder: newOrder,
            isActive: isActive === 'on'
        });

        req.flash('success', 'FAQ updated successfully');
        return redirectWithFlash(req, res, '/faqs');
    } catch (error) {
        console.error('Error in faq update:', error);
        req.flash('error', 'Something went wrong');
        return redirectWithFlash(req, res, `/faqs/${req.params.id}/edit`);
    }
};

export const destroy = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        if (!id) {
            req.flash('error', 'FAQ ID is required');
            return res.redirect('/faqs');
        }

        const faq = await FaqService.findFaqById(id);
        if (!faq) {
            req.flash('error', 'FAQ not found');
            return;
        }

        await FaqService.updateFaqById(id, { isDeleted: true });
        await FaqService.reorderOnDelete(faq.sortOrder);

        res.json({
            status: true,
            message: 'FAQ deleted successfully'
        });
    } catch (error) {
        console.error('Error in faq destroy:', error);
        req.flash('error', 'Something went wrong');
        return redirectWithFlash(req, res, '/faqs');
    }
};

export const toggleStatus = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const { isActive } = req.body;

        if (!id) {
            req.flash('error', 'ID is required');
            return redirectWithFlash(req, res, "/faqs")
        }
        const faq = await FaqService.updateFaqById(id, { isActive });

        if (faq) {
            res.json({ status: true, message: `Status ${isActive ? 'activated' : 'deactivated'} successfully` });
        } else {
            req.flash("error", "Error in update")
            return redirectWithFlash(req, res, "/faqs")
        }
    } catch (error) {
        console.error('Error in faq toggle status:', error);
        req.flash("error", "Something went wrong");
        return redirectWithFlash(req, res, "/faqs")
    }
};

export const bulkAction = async (req: Request, res: Response) => {
    try {
        const { action, ids } = req.body;

        if (!Array.isArray(ids) || ids.length < 1) {
            req.flash("error", "IDs are required")
            return redirectWithFlash(req, res, "/faqs")
        }

        let message = '';
        let success = true;

        switch (action) {
            case 'activate':
                await FaqService.bulkUpdate(ids, { isActive: true });
                message = `${ids.length} FAQs activated successfully`;
                break;
            case 'deactivate':
                await FaqService.bulkUpdate(ids, { isActive: false });
                message = `${ids.length} FAQs deactivated successfully`;
                break;
            case 'delete':
                await FaqService.bulkUpdate(ids, { isDeleted: true });
                message = `${ids.length} FAQs deleted successfully`;
                // Note: sorting might be off after bulk delete, but soft delete makes it acceptable for now.
                break;
            default:
                success = false;
                message = 'Invalid action';
        }

        if (success) {
            res.json({ status: true, message });
        } else {
            res.status(400).json({ status: false, message });
        }

    } catch (error) {
        console.error('Error in faq bulk action:', error);
        req.flash("error", "Something went wrong");
        return redirectWithFlash(req, res, "/faqs")
    }
};
