'use strict';

module.exports = function(fractal){

    return {
        include(Twig) {
            return {
                /**
                 * Block logic tokens.
                 *
                 *  Format: {% includes "template.twig" [with {some: 'values'} only] %}
                 */
                type: Twig.logic.type.include,
                regex: /^include\s+(ignore missing\s+)?(.+?)\s*(?:with\s+([\S\s]+?))?\s*(only)?$/,
                next: [],
                open: true,
                compile: function (token) {
                    var match = token.match,
                      includeMissing = match[1] !== undefined,
                      expression = match[2].trim(),
                      withContext = match[3],
                      only = ((match[4] !== undefined) && match[4].length);

                    delete token.match;

                    token.only = only;
                    token.includeMissing = includeMissing;

                    token.stack = Twig.expression.compile.apply(this, [
                        {
                            type: Twig.expression.type.expression,
                            value: expression
                        }
                    ]).stack;

                    if (withContext !== undefined) {
                        token.withStack = Twig.expression.compile.apply(this, [
                            {
                                type: Twig.expression.type.expression,
                                value: withContext.trim()
                            }
                        ]).stack;
                    }

                    return token;
                },
                parse: function (token, context, chain) {
                    // Resolve filename
                    var innerContext = {},
                      withContext,
                      i,
                      template;

                    if (!token.only) {
                        innerContext = Twig.ChildContext(context);
                    }

                    if (token.withStack !== undefined) {
                        withContext = Twig.expression.parse.apply(this, [
                            token.withStack,
                            context
                        ]);

                        for (i in withContext) {
                            if (withContext.hasOwnProperty(i))
                                innerContext[i] = withContext[i];
                        }
                    }

                    var file = Twig.expression.parse.apply(this, [
                        token.stack,
                        innerContext
                    ]);

                    if (file instanceof Twig.Template) {
                        template = file;
                    }
                    else {
                        // Import file
                        template = this.importFile(file);
                    }

                    return {
                        chain: chain,
                        output: template.render(innerContext)
                    };
                }
            }
        },
        trans(Twig) {
            return {
                type: 'trans',
                regex: /^trans/,
                next: ['endtrans'],
                open: true,
                compile: function (token) {
                    return token;
                },
                parse: function (token, context, chain) {
                    return {
                        chain: chain,
                        output: Twig.parse.apply(this, [token.output, context])
                    };
                }
            };
        },
        endtrans(Twig) {
            return {
                type: 'endtrans',
                regex: /^endtrans/,
                next: [ ],
                open: false
            };
        }
    }

};
