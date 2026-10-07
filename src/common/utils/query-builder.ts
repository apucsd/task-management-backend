/**
 * USAGE:
 * new QueryBuilder(this.prisma.user, query)
 *     .search(['name', 'email'])  // WHERE OR: name/email contains searchTerm
 *     .filter()                   // WHERE: any extra query params (isActive, role, etc.)
 *     .sort()                     // ORDER BY: ?sort=name or ?sort=-createdAt (- = desc)
 *     .paginate()                 // SKIP & TAKE: ?page=1&limit=10
 *     .fields()                   // SELECT: ?fields=name,email
 *     .exclude()                  // SELECT false: ?exclude=password,secret
 *     .customFields()             // SELECT: ?customFields={"name":"name","email":"email"}
 *     .execute();                 // fires the query, returns { data, meta }
 *
 * RULES:
 * 1. .execute() must ALWAYS be last
 * 2. All methods are optional except .execute()
 * 3. .fields() and .customFields() are mutually exclusive — use one or the other
 */

type ExtractSelect<T> = T extends { findMany(args: { select: infer S }): any }
    ? S
    : never;

class QueryBuilder<
    ModelDelegate extends {
        findMany: (...args: any[]) => any;
        count: (...args: any[]) => any;
    },
> {
    private model: ModelDelegate;
    private query: Record<string, unknown>;
    private prismaQuery: any = {};
    private primaryKeyField: string = 'id';
    private shouldUnnestCount: boolean = false;

    constructor(model: ModelDelegate, query: Record<string, unknown>) {
        this.model = model;
        this.query = query;
    }

    search(searchableFields: string[]) {
        const searchTerm = this.query.searchTerm as string;
        if (searchTerm) {
            this.prismaQuery.where = {
                ...this.prismaQuery.where,
                OR: searchableFields.map((field) => {
                    if (field.includes('.')) {
                        const [parentField, childField] = field.split('.');
                        return {
                            [parentField]: {
                                [childField]: {
                                    contains: searchTerm,
                                    mode: 'insensitive',
                                },
                            },
                        };
                    }
                    return {
                        [field]: { contains: searchTerm, mode: 'insensitive' },
                    };
                }),
            };
        }
        return this;
    }

    filter() {
        const queryObj = { ...this.query };
        const excludeFields = [
            'searchTerm',
            'sort',
            'limit',
            'page',
            'fields',
            'exclude',
        ];
        excludeFields.forEach((field) => delete queryObj[field]);

        const formattedFilters: Record<string, unknown> = {};

        const convertValue = (value: unknown): unknown => {
            if (value === 'true') return true;
            if (value === 'false') return false;
            if (
                typeof value === 'string' &&
                value.trim() !== '' &&
                !isNaN(Number(value))
            ) {
                return Number(value);
            }
            return value;
        };

        const setNestedObject = (
            obj: Record<string, any>,
            path: string,
            value: unknown,
        ) => {
            const keys = path.split('.');
            let current = obj;
            keys.forEach((key, index) => {
                if (index === keys.length - 1) {
                    current[key] = convertValue(value);
                } else {
                    if (!current[key] || typeof current[key] !== 'object') {
                        current[key] = {};
                    }
                    current = current[key];
                }
            });
        };

        for (const [key, value] of Object.entries(queryObj)) {
            setNestedObject(formattedFilters, key, value);
        }

        this.prismaQuery.where = {
            ...this.prismaQuery.where,
            ...formattedFilters,
        };

        return this;
    }

    where(condition: Record<string, any>) {
        if (condition && Object.keys(condition).length > 0) {
            if (this.prismaQuery.where?.OR && condition.OR) {
                const existingOR = this.prismaQuery.where.OR;
                const newOR = condition.OR;
                const { OR: _discardExisting, ...restWhere } =
                    this.prismaQuery.where;
                const { OR: _discardNew, ...restCondition } = condition;
                this.prismaQuery.where = {
                    ...restWhere,
                    ...restCondition,
                    AND: [
                        ...(this.prismaQuery.where.AND || []),
                        { OR: existingOR },
                        { OR: newOR },
                    ],
                };
            } else {
                this.prismaQuery.where = {
                    ...this.prismaQuery.where,
                    ...condition,
                };
            }
        }
        return this;
    }

    sort() {
        const sort = (this.query.sort as string)?.split(',') || ['-createdAt'];
        this.prismaQuery.orderBy = sort.map((field) =>
            field.startsWith('-')
                ? { [field.slice(1)]: 'desc' }
                : { [field]: 'asc' },
        );
        return this;
    }

    paginate() {
        const page = Number(this.query.page) || 1;
        const limit = Number(this.query.limit) || 10;
        const skip = (page - 1) * limit;

        this.prismaQuery.skip = skip;
        this.prismaQuery.take = limit;

        return this;
    }

    fields() {
        const fieldsParam = this.query.fields as string;
        if (fieldsParam) {
            const fields = fieldsParam
                .split(',')
                .filter((field) => field.trim() !== '');

            if (fields.length > 0) {
                this.prismaQuery.select = {};
                fields.forEach((field) => {
                    const trimmedField = field.trim();
                    if (trimmedField.startsWith('-')) {
                        this.prismaQuery.select[trimmedField.slice(1)] = false;
                    } else {
                        this.prismaQuery.select[trimmedField] = true;
                    }
                });

                const hasAtLeastOneTrueField = Object.values(
                    this.prismaQuery.select,
                ).some((value) => value === true);
                if (!hasAtLeastOneTrueField) {
                    this.prismaQuery.select[this.primaryKeyField] = true;
                }
            }
        }
        return this;
    }

    customFields(data: ExtractSelect<ModelDelegate>) {
        if (data) {
            this.prismaQuery.select = data;
        }
        return this;
    }

    exclude() {
        const excludeParam = this.query.exclude as string;
        if (excludeParam) {
            const excludeFields = excludeParam
                .split(',')
                .filter((field) => field.trim() !== '');

            if (!this.prismaQuery.select) {
                this.prismaQuery.select = {};
            }

            excludeFields.forEach((field) => {
                this.prismaQuery.select[field.trim()] = false;
            });

            const hasAtLeastOneTrueField = Object.values(
                this.prismaQuery.select,
            ).some((value) => value === true);
            if (!hasAtLeastOneTrueField) {
                this.prismaQuery.select[this.primaryKeyField] = true;
            }
        }
        return this;
    }

    unnestCount() {
        this.shouldUnnestCount = true;
        return this;
    }

    async execute() {
        if (this.prismaQuery.select) {
            if (Object.keys(this.prismaQuery.select).length === 0) {
                delete this.prismaQuery.select;
            }

            if (this.query.fields) {
                const hasAtLeastOneTrueField = Object.values(
                    this.prismaQuery.select,
                ).some((value) => value === true);
                if (!hasAtLeastOneTrueField) {
                    this.prismaQuery.select[this.primaryKeyField] = true;
                }
            }
        }

        const [results, total] = await Promise.all([
            this.model.findMany(this.prismaQuery),
            this.model.count({ where: this.prismaQuery.where }),
        ]);

        let processedResults = results;
        if (this.query.fields && results.length > 0) {
            const fieldsRequested = (this.query.fields as string)
                .split(',')
                .map((f) => f.trim());
            if (!fieldsRequested.includes(this.primaryKeyField)) {
                processedResults = results.map(
                    (item: Record<string, unknown>) => {
                        const newItem = { ...item };
                        delete newItem[this.primaryKeyField];
                        return newItem;
                    },
                );
            }
        }

        if (this.shouldUnnestCount && processedResults.length > 0) {
            processedResults = processedResults.map(
                (item: Record<string, unknown>) => {
                    const { _count, ...rest } = item;
                    return {
                        ...rest,
                        ...(typeof _count === 'object'
                            ? (_count as object)
                            : {}),
                    };
                },
            );
        }

        const page = Number(this.query.page) || 1;
        const limit = Number(this.query.limit) || 10;

        return {
            data: processedResults,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}

export default QueryBuilder;
