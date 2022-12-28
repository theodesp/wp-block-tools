import React, { Fragment } from 'react';
import convertHtmlToReact, { convertNodeToReactElement } from '@hedgedoc/html-to-react';
import { Helmet } from 'react-helmet';
import { v4 } from 'uuid';
import parse from 'html-dom-parser';

const hasClass = (nd, className) => {
    var _a, _b, _c;
    return (!!((_a = nd.attribs) === null || _a === void 0 ? void 0 : _a.class) &&
        ((_c = (_b = nd.attribs) === null || _b === void 0 ? void 0 : _b.class) === null || _c === void 0 ? void 0 : _c.split(' ').find((c) => c === className)));
};
const BlockRenderer = ({ blocks = [], render, customInternalLinkComponent, }) => {
    const inlineStylesheets = blocks
        .filter((block) => !!block.inlineStylesheet)
        .map((block) => block.inlineStylesheet);
    return (React.createElement(React.Fragment, null,
        !!inlineStylesheets.length && (React.createElement(Helmet, null, inlineStylesheets.map((stylesheet, i) => (React.createElement("style", { key: i }, stylesheet))))),
        blocks.map((block) => {
            var _a, _b;
            // render custom component for this block if exists
            const component = render === null || render === void 0 ? void 0 : render(block);
            if (component) {
                return component;
            }
            const processNode = (shouldProcessNode) => {
                var _a;
                if ((_a = block.innerBlocks) === null || _a === void 0 ? void 0 : _a.length) {
                    const InnerBlocks = (React.createElement(BlockRenderer, { key: block.id, blocks: block.innerBlocks || [], render: render, customInternalLinkComponent: customInternalLinkComponent }));
                    let topLevelFound = false;
                    return convertHtmlToReact(block.originalContent || '', {
                        transform: (node, i) => {
                            var _a, _b, _c, _d, _e, _f;
                            if (i === 0 && !topLevelFound) {
                                topLevelFound = true;
                                if (!((_a = node.attribs) === null || _a === void 0 ? void 0 : _a.class)) {
                                    if (!node.attribs) {
                                        node.attribs = {};
                                    }
                                }
                                if ((_c = (_b = block.attributes) === null || _b === void 0 ? void 0 : _b.layout) === null || _c === void 0 ? void 0 : _c.type) {
                                    node.attribs.class = `${node.attribs.class} is-layout-${(_e = (_d = block.attributes) === null || _d === void 0 ? void 0 : _d.layout) === null || _e === void 0 ? void 0 : _e.type}`;
                                }
                                if (block.inlineClassnames) {
                                    node.attribs.class = `${node.attribs.class} ${block.inlineClassnames}`;
                                }
                                if (block.name === 'core/cover' &&
                                    block.attributes.useFeaturedImage) {
                                    node.attribs.style = `background-image:url(${block.attributes.url});`;
                                    if (!block.attributes.hasParallax) {
                                        node.attribs.style = `${node.attribs.style}background-size: cover;`;
                                    }
                                }
                                if (block.name === 'core/buttons' ||
                                    block.name === 'core/columns' ||
                                    block.name === 'core/social-links' ||
                                    block.name === 'core/gallery') {
                                    node.attribs.class = `${node.attribs.class} is-layout-flex`;
                                }
                            }
                            // FIX when children have no data value,
                            // it doesn't correctly "convertNodeToReactElement" / doesn't render
                            if (!((_f = node.children) === null || _f === void 0 ? void 0 : _f.length)) {
                                node.children = [
                                    {
                                        data: '\n',
                                    },
                                ];
                            }
                            if (shouldProcessNode(node)) {
                                return convertNodeToReactElement(node, i, () => InnerBlocks);
                            }
                        },
                    });
                }
                return (React.createElement(Fragment, { key: block.id }, convertHtmlToReact(block.originalContent || block.dynamicContent || '', {
                    transform: (node, index) => {
                        return convertNodeToReactElement(node, index, function transform(n, i) {
                            // process if anchor tag and has customInternalLinkComponent
                            if (n.name === 'a' &&
                                (customInternalLinkComponent === null || customInternalLinkComponent === void 0 ? void 0 : customInternalLinkComponent.render) &&
                                (customInternalLinkComponent === null || customInternalLinkComponent === void 0 ? void 0 : customInternalLinkComponent.siteDomain) &&
                                n.attribs.href.indexOf(customInternalLinkComponent.siteDomain) === 0) {
                                const reactElement = convertNodeToReactElement(n, i);
                                return customInternalLinkComponent.render(Object.assign(Object.assign({}, (n.attribs || {})), { children: reactElement.props.children }), i);
                            }
                        });
                    },
                })));
            };
            if (!block.originalContent &&
                block.dynamicContent &&
                !((_a = block.innerBlocks) === null || _a === void 0 ? void 0 : _a.length)) {
                return processNode(() => true);
            }
            if (!block.originalContent && ((_b = block.innerBlocks) === null || _b === void 0 ? void 0 : _b.length)) {
                return (React.createElement("div", { key: block.id },
                    React.createElement(BlockRenderer, { blocks: block.innerBlocks, render: render })));
            }
            switch (block.name) {
                case 'core/media-text': {
                    return processNode((node) => hasClass(node, 'wp-block-media-text__content'));
                }
                case 'core/cover': {
                    return processNode((node) => hasClass(node, 'wp-block-cover__inner-container'));
                }
                default: {
                    return processNode(() => true);
                }
            }
        })));
};
const RootBlockRenderer = ({ blocks = [], render, customInternalLinkComponent, }) => {
    return (React.createElement("div", { className: "wp-site-blocks", style: { paddingTop: 0 } },
        React.createElement("main", { className: "is-layout-flow wp-block-group" },
            React.createElement("div", { className: "has-global-padding is-layout-constrained entry-content wp-block-post-content" },
                React.createElement(BlockRenderer, { blocks: blocks, render: render, customInternalLinkComponent: customInternalLinkComponent })))));
};

const assignIds = (blocks) => {
    const blocksCopy = [...blocks];
    const assignId = (b) => {
        b.forEach((block) => {
            var _a;
            block.id = v4();
            if ((_a = block.innerBlocks) === null || _a === void 0 ? void 0 : _a.length) {
                assignId(block.innerBlocks);
            }
        });
    };
    assignId(blocksCopy);
    return blocksCopy;
};

const getBorderRadiusStyle = (attributes) => {
    var _a, _b, _c, _d;
    const borderRadiusStyle = {};
    if (typeof ((_b = (_a = attributes.style) === null || _a === void 0 ? void 0 : _a.border) === null || _b === void 0 ? void 0 : _b.radius) === 'object') {
        const { radius } = attributes.style.border;
        borderRadiusStyle.borderBottomLeftRadius = radius.bottomLeft;
        borderRadiusStyle.borderTopLeftRadius = radius.topLeft;
        borderRadiusStyle.borderTopRightRadius = radius.topRight;
        borderRadiusStyle.borderBottomRightRadius = radius.bottomRight;
    }
    else if ((_d = (_c = attributes.style) === null || _c === void 0 ? void 0 : _c.border) === null || _d === void 0 ? void 0 : _d.radius) {
        borderRadiusStyle.borderRadius = attributes.style.border.radius;
    }
    return borderRadiusStyle;
};

const parseValue = (value) => {
    if (value.indexOf('var:') === 0) {
        return `${value.replace(':', '(--wp--').split('|').join('--')})`;
    }
    return value;
};

const getBorderStyle = (attributes) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3;
    const borderStyle = {};
    if (attributes.borderColor) {
        borderStyle.borderColor = `var(--wp--preset--color--${attributes.borderColor})`;
    }
    if ((_b = (_a = attributes.style) === null || _a === void 0 ? void 0 : _a.border) === null || _b === void 0 ? void 0 : _b.color) {
        borderStyle.borderColor = attributes.style.border.color;
    }
    if ((_d = (_c = attributes.style) === null || _c === void 0 ? void 0 : _c.border) === null || _d === void 0 ? void 0 : _d.width) {
        borderStyle.borderWidth = attributes.style.border.width;
    }
    if ((_g = (_f = (_e = attributes.style) === null || _e === void 0 ? void 0 : _e.border) === null || _f === void 0 ? void 0 : _f.bottom) === null || _g === void 0 ? void 0 : _g.color) {
        borderStyle.borderBottomColor = parseValue(attributes.style.border.bottom.color);
    }
    if ((_k = (_j = (_h = attributes.style) === null || _h === void 0 ? void 0 : _h.border) === null || _j === void 0 ? void 0 : _j.bottom) === null || _k === void 0 ? void 0 : _k.width) {
        borderStyle.borderBottomWidth = parseValue(attributes.style.border.bottom.width);
    }
    if ((_o = (_m = (_l = attributes.style) === null || _l === void 0 ? void 0 : _l.border) === null || _m === void 0 ? void 0 : _m.top) === null || _o === void 0 ? void 0 : _o.color) {
        borderStyle.borderTopColor = parseValue(attributes.style.border.top.color);
    }
    if ((_r = (_q = (_p = attributes.style) === null || _p === void 0 ? void 0 : _p.border) === null || _q === void 0 ? void 0 : _q.top) === null || _r === void 0 ? void 0 : _r.width) {
        borderStyle.borderTopWidth = parseValue(attributes.style.border.top.width);
    }
    if ((_u = (_t = (_s = attributes.style) === null || _s === void 0 ? void 0 : _s.border) === null || _t === void 0 ? void 0 : _t.left) === null || _u === void 0 ? void 0 : _u.color) {
        borderStyle.borderLeftColor = parseValue(attributes.style.border.left.color);
    }
    if ((_x = (_w = (_v = attributes.style) === null || _v === void 0 ? void 0 : _v.border) === null || _w === void 0 ? void 0 : _w.left) === null || _x === void 0 ? void 0 : _x.width) {
        borderStyle.borderLeftWidth = parseValue(attributes.style.border.left.width);
    }
    if ((_0 = (_z = (_y = attributes.style) === null || _y === void 0 ? void 0 : _y.border) === null || _z === void 0 ? void 0 : _z.right) === null || _0 === void 0 ? void 0 : _0.color) {
        borderStyle.borderRightColor = parseValue(attributes.style.border.right.color);
    }
    if ((_3 = (_2 = (_1 = attributes.style) === null || _1 === void 0 ? void 0 : _1.border) === null || _2 === void 0 ? void 0 : _2.right) === null || _3 === void 0 ? void 0 : _3.width) {
        borderStyle.borderRightWidth = parseValue(attributes.style.border.right.width);
    }
    return borderStyle;
};

const getMarginStyle = (attributes) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    const marginStyle = {};
    if ((_c = (_b = (_a = attributes.style) === null || _a === void 0 ? void 0 : _a.spacing) === null || _b === void 0 ? void 0 : _b.margin) === null || _c === void 0 ? void 0 : _c.bottom) {
        marginStyle.marginBottom = parseValue(attributes.style.spacing.margin.bottom);
    }
    if ((_f = (_e = (_d = attributes.style) === null || _d === void 0 ? void 0 : _d.spacing) === null || _e === void 0 ? void 0 : _e.margin) === null || _f === void 0 ? void 0 : _f.top) {
        marginStyle.marginTop = parseValue(attributes.style.spacing.margin.top);
    }
    if ((_j = (_h = (_g = attributes.style) === null || _g === void 0 ? void 0 : _g.spacing) === null || _h === void 0 ? void 0 : _h.margin) === null || _j === void 0 ? void 0 : _j.left) {
        marginStyle.marginLeft = parseValue(attributes.style.spacing.margin.left);
    }
    if ((_m = (_l = (_k = attributes.style) === null || _k === void 0 ? void 0 : _k.spacing) === null || _l === void 0 ? void 0 : _l.margin) === null || _m === void 0 ? void 0 : _m.right) {
        marginStyle.marginRight = parseValue(attributes.style.spacing.margin.right);
    }
    return marginStyle;
};

const getPaddingStyle = (attributes) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    const paddingStyle = {};
    if ((_c = (_b = (_a = attributes.style) === null || _a === void 0 ? void 0 : _a.spacing) === null || _b === void 0 ? void 0 : _b.padding) === null || _c === void 0 ? void 0 : _c.bottom) {
        paddingStyle.paddingBottom = parseValue(attributes.style.spacing.padding.bottom);
    }
    if ((_f = (_e = (_d = attributes.style) === null || _d === void 0 ? void 0 : _d.spacing) === null || _e === void 0 ? void 0 : _e.padding) === null || _f === void 0 ? void 0 : _f.top) {
        paddingStyle.paddingTop = parseValue(attributes.style.spacing.padding.top);
    }
    if ((_j = (_h = (_g = attributes.style) === null || _g === void 0 ? void 0 : _g.spacing) === null || _h === void 0 ? void 0 : _h.padding) === null || _j === void 0 ? void 0 : _j.left) {
        paddingStyle.paddingLeft = parseValue(attributes.style.spacing.padding.left);
    }
    if ((_m = (_l = (_k = attributes.style) === null || _k === void 0 ? void 0 : _k.spacing) === null || _l === void 0 ? void 0 : _l.padding) === null || _m === void 0 ? void 0 : _m.right) {
        paddingStyle.paddingRight = parseValue(attributes.style.spacing.padding.right);
    }
    return paddingStyle;
};

const getBackgroundStyle = (attributes) => {
    var _a, _b;
    const backgroundStyle = {};
    if (attributes.backgroundColor) {
        backgroundStyle.backgroundColor = `var(--wp--preset--color--${attributes.backgroundColor})`;
    }
    if ((_b = (_a = attributes.style) === null || _a === void 0 ? void 0 : _a.color) === null || _b === void 0 ? void 0 : _b.background) {
        backgroundStyle.backgroundColor = attributes.style.color.background;
    }
    return backgroundStyle;
};

const getTextStyle = (attributes) => {
    var _a, _b;
    const textStyle = {};
    if (attributes.textColor) {
        textStyle.color = `var(--wp--preset--color--${attributes.textColor})`;
    }
    if ((_b = (_a = attributes.style) === null || _a === void 0 ? void 0 : _a.color) === null || _b === void 0 ? void 0 : _b.text) {
        textStyle.color = attributes.style.color.text;
    }
    return textStyle;
};

const getTypographyStyle = (attributes) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    const typographyStyle = {};
    if (attributes.fontFamily) {
        typographyStyle.fontFamily = `var(--wp--preset--font-family--${attributes.fontFamily})`;
    }
    if (attributes.fontSize) {
        typographyStyle.fontSize = `var(--wp--preset--font-size--${attributes.fontSize})`;
    }
    if ((_b = (_a = attributes.style) === null || _a === void 0 ? void 0 : _a.typography) === null || _b === void 0 ? void 0 : _b.fontSize) {
        typographyStyle.fontSize = attributes.style.typography.fontSize;
    }
    if ((_d = (_c = attributes.style) === null || _c === void 0 ? void 0 : _c.typography) === null || _d === void 0 ? void 0 : _d.fontStyle) {
        typographyStyle.fontStyle = attributes.style.typography.fontStyle;
    }
    if ((_f = (_e = attributes.style) === null || _e === void 0 ? void 0 : _e.typography) === null || _f === void 0 ? void 0 : _f.fontWeight) {
        typographyStyle.fontWeight = attributes.style.typography.fontWeight;
    }
    if ((_h = (_g = attributes.style) === null || _g === void 0 ? void 0 : _g.typography) === null || _h === void 0 ? void 0 : _h.lineHeight) {
        typographyStyle.lineHeight = attributes.style.typography.lineHeight;
    }
    if ((_k = (_j = attributes.style) === null || _j === void 0 ? void 0 : _j.typography) === null || _k === void 0 ? void 0 : _k.textDecoration) {
        typographyStyle.textDecoration = attributes.style.typography.textDecoration;
    }
    if ((_m = (_l = attributes.style) === null || _l === void 0 ? void 0 : _l.typography) === null || _m === void 0 ? void 0 : _m.textTransform) {
        typographyStyle.textTransform = attributes.style.typography.textTransform;
    }
    return typographyStyle;
};

const getStyles = (attributes) => {
    return Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, getBorderRadiusStyle(attributes)), getBorderStyle(attributes)), getPaddingStyle(attributes)), getMarginStyle(attributes)), getTypographyStyle(attributes)), getTextStyle(attributes)), getBackgroundStyle(attributes));
};

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

const assignGatsbyImage = ({ blocks = [], graphql, coreImage, coreMediaText, coreCover, }) => __awaiter(void 0, void 0, void 0, function* () {
    const blocksCopy = [...blocks];
    const imagesToRetrieve = [];
    const addedImages = {};
    const retrieveGatsbyImage = (b) => {
        var _a;
        for (let i = 0; i < b.length; i++) {
            const block = b[i];
            if ((coreImage && block.name === 'core/image') ||
                (coreCover && block.name === 'core/cover') ||
                (coreMediaText && block.name === 'core/media-text')) {
                const id = block.attributes.id || block.attributes.mediaId;
                const width = block.attributes.width;
                if (!!id && !addedImages[id]) {
                    try {
                        const query = graphql(`
            query ImageQuery${id} {
              wpMediaItem(databaseId: { eq: ${id} }) {
                databaseId
                gatsbyImage(width: ${Math.min(width, 1200)})
              }
            }
          `);
                        imagesToRetrieve.push(query);
                        addedImages[id] = true;
                    }
                    catch (e) {
                        console.log('ERROR: ', e);
                    }
                }
            }
            if ((_a = block.innerBlocks) === null || _a === void 0 ? void 0 : _a.length) {
                retrieveGatsbyImage(block.innerBlocks);
            }
        }
    };
    retrieveGatsbyImage(blocksCopy);
    const images = yield Promise.allSettled(imagesToRetrieve);
    const imagesMap = {};
    images
        .filter((image) => { var _a; return !!((_a = image.value.data) === null || _a === void 0 ? void 0 : _a.wpMediaItem); })
        .forEach((image) => {
        if (image.status === 'fulfilled') {
            const { databaseId, gatsbyImage } = image.value.data.wpMediaItem;
            imagesMap[databaseId] = {
                databaseId,
                gatsbyImage,
            };
        }
    });
    const setGatsbyImage = (b) => {
        b.forEach((block) => {
            var _a, _b;
            if ((coreImage && block.name === 'core/image') ||
                (coreCover && block.name === 'core/cover') ||
                (coreMediaText && block.name === 'core/media-text')) {
                const id = block.attributes.id || block.attributes.mediaId;
                block.attributes.gatsbyImage = (_a = imagesMap[id]) === null || _a === void 0 ? void 0 : _a.gatsbyImage;
            }
            if ((_b = block.innerBlocks) === null || _b === void 0 ? void 0 : _b.length) {
                setGatsbyImage(block.innerBlocks);
            }
        });
    };
    setGatsbyImage(blocksCopy);
    return blocksCopy;
});

const getClasses = (block) => {
    var _a, _b;
    const parsed = parse(block.originalContent || '');
    return ((_b = (_a = parsed[0]) === null || _a === void 0 ? void 0 : _a.attribs) === null || _b === void 0 ? void 0 : _b.class) || '';
};

export { BlockRenderer, RootBlockRenderer, assignGatsbyImage, assignIds, getBackgroundStyle, getBorderRadiusStyle, getBorderStyle, getClasses, getMarginStyle, getPaddingStyle, getStyles, getTextStyle, getTypographyStyle, parseValue };
//# sourceMappingURL=index.js.map
