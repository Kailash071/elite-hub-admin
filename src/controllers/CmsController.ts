import type { Request, Response } from 'express';
import * as CmsService from '../services/cms.js';
import { redirectWithFlash } from './index.js';

export const index = async (req: Request, res: Response) => {
    try {
        res.render('modules/cms/index', {
            pageTitle: 'CMS Pages',
            pageDescription: 'Manage content pages',
            currentPage: 'cms',
            breadcrumbs: [
                { text: 'Dashboard', url: '/dashboard' },
                { text: 'CMS Pages', url: '/cms' }
            ],
            title: 'CMS Pages',
            activeMenu: 'cms',
            error: req.flash("error"),
            success: req.flash("success")
        });
    } catch (error) {
        console.error('Error in cms index:', error);
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
                { title: { $regex: search.value, $options: 'i' } },
                { type: { $regex: search.value, $options: 'i' } }
            ];
        }

        if (status) query.isActive = status === 'Active';

        // Sorting
        const sort: any = {};
        if (order && order.length > 0) {
            const columnIndex = order[0].column;
            const dir = order[0].dir === 'asc' ? 1 : -1;
            const columnName = columns[columnIndex].name;

            if (['title', 'type', 'isActive'].includes(columnName)) {
                sort[columnName] = dir;
            } else {
                sort.sortOrder = 1; // Default
            }
        } else {
            sort.sortOrder = 1;
        }

        const result = await CmsService.findPages(query, { page, limit, sort });
        // Since findPages returns { pages: [...], total: N } now

        res.json({
            draw: parseInt(draw) || 1,
            recordsTotal: await CmsService.countPages({ isDeleted: false }),
            recordsFiltered: result.total,
            data: result.pages
        });
    } catch (error) {
        console.error('Error in cms indexData:', error);
        res.status(500).json({ error: 'Failed to fetch CMS data' });
    }
};

export const create = (req: Request, res: Response) => {
    try {
        res.render('modules/cms/form', {
            pageTitle: 'Add New Page',
            pageDescription: 'Create a new content page',
            currentPage: 'cms',
            breadcrumbs: [
                { text: 'Dashboard', url: '/dashboard' },
                { text: 'CMS Pages', url: '/cms' },
                { text: 'Add Page', url: '/cms/add' }
            ],
            title: 'Add New Page',
            activeMenu: 'cms',
            error: req.flash("error"),
            success: req.flash("success")
        });
    } catch (error) {
        console.error('Error rendering cms create form:', error);
        res.status(500).render('errors/500.njk');
    }
};

export const store = async (req: Request, res: Response) => {
    try {
        const { title, type, content, isActive } = req.body;

        const exists = await CmsService.pageExists(type);
        if (exists) {
            req.flash('error', 'Page with this type already exists');
            return redirectWithFlash(req, res, '/cms/add');
        }

        await CmsService.createPage({
            title,
            type,
            content,
            isActive: isActive === 'on'
        });

        req.flash('success', 'Page created successfully');
        return redirectWithFlash(req, res, '/cms');
    } catch (error) {
        console.error('Error in cms store:', error);
        req.flash('error', 'Something went wrong');
        return redirectWithFlash(req, res, '/cms/add');
    }
};

export const edit = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        if (!id) {
            req.flash('error', 'Page ID is required');
            return redirectWithFlash(req, res, '/cms');
        }

        const page = await CmsService.findPageById(id);

        if (!page) {
            req.flash('error', 'Page not found');
            return redirectWithFlash(req, res, '/cms');
        }

        res.render('modules/cms/form', {
            pageTitle: `Edit ${page.title}`,
            pageDescription: 'Edit content page',
            currentPage: 'cms',
            title: `Edit ${page.title}`,
            page,
            activeMenu: 'cms',
            breadcrumbs: [
                { text: 'Dashboard', url: '/dashboard' },
                { text: 'CMS Pages', url: '/cms' },
                { text: 'Edit Page', url: `/cms/${id}/edit` }
            ],
            error: req.flash("error"),
            success: req.flash("success")
        });
    } catch (error) {
        console.error('Error in cms edit:', error);
        res.status(500).render('errors/500.njk');
    }
};

export const update = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const { title, type, content, isActive } = req.body;

        if (!id) {
            req.flash('error', 'Page ID is required');
            return redirectWithFlash(req, res, '/cms');
        }

        const page = await CmsService.findPageById(id);

        if (!page) {
            req.flash('error', 'Page not found');
            return redirectWithFlash(req, res, '/cms');
        }

        // Check if type is being changed and if it conflicts
        if (type !== page.type) {
            const exists = await CmsService.pageExists(type);
            if (exists) {
                req.flash('error', 'Page with this type already exists');
                return redirectWithFlash(req, res, `/cms/${id}/edit`);
            }
        }

        await CmsService.updatePageById(id, {
            title,
            type,
            content,
            isActive: isActive === 'on'
        });

        req.flash('success', 'Page updated successfully');
        return redirectWithFlash(req, res, '/cms');
    } catch (error) {
        console.error('Error in cms update:', error);
        req.flash('error', 'Something went wrong');
        return redirectWithFlash(req, res, `/cms/${req.params.id}/edit`);
    }
};

export const destroy = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        if (!id) {
            req.flash('error', 'Page ID is required');
            return redirectWithFlash(req, res, '/cms');
        }

        const page = await CmsService.findPageById(id);
        if (!page) {
            req.flash("error", "Page not found");
            return res.json({ status: false, message: 'Page not found' }); // For AJAX delete, still return JSON
        }

        await CmsService.deletePageById(id);

        res.json({
            status: true,
            message: 'Page deleted successfully'
        });
    } catch (error) {
        console.error('Error in cms destroy:', error);
        req.flash('error', 'Failed to delete page');
        return res.status(500).json({ status: false, message: 'Failed to delete page' }); // For AJAX delete, still return JSON
    }
};

export const toggleStatus = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const { isActive } = req.body;

        if (!id) {
            req.flash('error', 'ID is required');
            return res.status(400).json({ status: false, message: 'ID is required' });
        }

        const page = await CmsService.updatePageById(id, { isActive });

        if (page) {
            res.json({ status: true, message: `Page ${isActive ? 'activated' : 'deactivated'} successfully` });
        } else {
            req.flash("error", "Error in update")
            return res.status(404).json({ status: false, message: 'Page not found' });
        }
    } catch (error) {
        console.error('Error in cms toggle status:', error);
        req.flash("error", "Something went wrong");
        return res.status(500).json({ status: false, message: 'Internal server error' });
    }
};

export const bulkAction = async (req: Request, res: Response) => {
    try {
        const { action, ids } = req.body; // ids expects array

        if (!Array.isArray(ids) || ids.length < 1) {
            req.flash("error", "IDs are required")
            return res.status(400).json({ status: false, message: 'IDs are required' });
        }

        let message = '';
        let success = true;

        switch (action) {
            case 'activate':
                await CmsService.bulkUpdate(ids, { isActive: true });
                message = `${ids.length} pages activated successfully`;
                break;
            case 'deactivate':
                await CmsService.bulkUpdate(ids, { isActive: false });
                message = `${ids.length} pages deactivated successfully`;
                break;
            case 'delete':
                await CmsService.bulkUpdate(ids, { isDeleted: true });
                message = `${ids.length} pages deleted successfully`;
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
        console.error('Error in cms bulk action:', error);
        req.flash("error", "Something went wrong");
        return res.status(500).json({ status: false, message: 'Something went wrong' });
    }
};
