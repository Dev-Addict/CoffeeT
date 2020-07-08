const catchRequest = require('../utils/catchRequest');
const AppError = require('../utils/AppError');
const APIFeatures = require('../utils/APIFeatures');

exports.deleteOne = Model =>
    catchRequest(
        async (req, res) => {
            const doc = await Model.findByIdAndDelete(req.params.id);
            if (!doc) {
                throw new AppError('No document found with specified ID', 404);
            }

            res.status(204).json({
                status: 'success',
                data: null
            });
        }
    );

exports.updateOne = Model =>
    catchRequest(
        async (req, res) => {
            req.body.isEmailValidated = undefined;
            const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
                new: true,
                runValidators: true
            });

            if (!doc) {
                throw new AppError('No document found with that ID', 404);
            }

            res.status(200).json({
                status: 'success',
                data: {
                    doc
                }
            });
        }
    );

exports.createOne = Model =>
    catchRequest(
        async (req, res) => {
            const doc = await Model.create(req.body);
            res.status(201).json({
                status: 'success',
                data: {
                    doc
                }
            });
        }
    );

exports.getOne = (Model, populateOptions) =>
    catchRequest(
        async (req, res) => {
            let query = Model.findById(req.params.id);
            if (populateOptions) {
                query = query.populate(populateOptions);
            }
            const doc = await query;
            if (!doc) {
                throw new AppError('No document found with this ID', 404);
            }
            res.status(201).json({
                status: 'success',
                data: {
                    doc
                }
            });
        }
    );

exports.getAll = Model =>
    catchRequest(
        async (req, res) => {
            const features =
                new APIFeatures(Model.find(), req.query)
                    .filter()
                    .sort()
                    .limitFields()
                    .paginate();
            const docs = await features.query;
            res.status(200).json({
                status: 'success',
                results: docs.length,
                page: features.queryString.page * 1 || 1,
                limit: features.queryString.limit * 1 || 20,
                data: {
                    docs
                }
            });
        }
    );