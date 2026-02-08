"use strict";


const METHODS = Object.freeze({
    GET: 1,
    POST: 2,
    PUT: 4,
    DELETE: 8,
    PATCH: 16,
    OPTIONS: 32,
    HEAD: 64
});

const BIT_INDEX =
    Object.freeze({
        1: 0, 2: 1, 4: 2, 8: 3, 16: 4, 32: 5, 64: 6
    });



class Node {

    constructor(segment) {

        this.segment = segment;

        // flat children array → cache friendly
        this.children = [];

        this.paramChild = null;
        this.paramName = null;

        this.wildcardChild = null;

        this.methods = 0;

        this.handlers = [
            null, null, null, null,
            null, null, null, null
        ];
        this.first = segment ? segment.charCodeAt(0) : 0;

    }


    // tiny scan beats hashing in real CPUs
    findChild(url, start, len) {

        const kids = this.children;

        for (let i = 0; i < kids.length; i++) {

            const child = kids[i];
            const seg = child.segment;

            if (
                child.first === url.charCodeAt(start) &&
                seg.length === len &&
                url.startsWith(seg, start)
            ) {
                return child;
            }
        }

        return null;
    }
}



class BangRouter {

    constructor() {
        this.root = new Node("");
    }


    register(method, path, handler) {

        const bit = METHODS[method];
        if (!bit) throw Error("Unsupported method");

        if (path.charCodeAt(0) !== 47) {
            throw Error("Path must start with /");
        }

        let node = this.root;

        let i = 1;
        let start = 1;

        while (i <= path.length) {

            if (i === path.length || path.charCodeAt(i) === 47) {

                const segment = path.slice(start, i);

                // PARAM
                if (segment.charCodeAt(0) === 58) {

                    if (!node.paramChild) {
                        const child = new Node("");
                        child.paramName = segment.slice(1);
                        node.paramChild = child;
                    }

                    node = node.paramChild;
                }

                // WILDCARD
                else if (segment === "*") {

                    if (i !== path.length) {
                        throw Error("Wildcard must be last");
                    }

                    if (!node.wildcardChild) {
                        node.wildcardChild = new Node("*");
                    }

                    node = node.wildcardChild;
                    break;
                }

                // STATIC
                else {

                    let child = null;
                    const kids = node.children;

                    for (let k = 0; k < kids.length; k++) {
                        if (kids[k].segment === segment) {
                            child = kids[k];
                            break;
                        }
                    }

                    if (!child) {
                        child = new Node(segment);
                        kids.push(child);
                    }

                    node = child;
                }

                start = i + 1;
            }

            i++;
        }


        // duplicate guard
        if (node.methods & bit) {
            throw Error("Duplicate route");
        }

        node.methods |= bit;
        node.handlers[BIT_INDEX[bit]] = handler;
    }


    match(method, url, params) {

        const bit = METHODS[method];
        if (!bit) return null;

        let node = this.root;

        let i = 1;
        let start = 1;

        while (i <= url.length) {

            if (i === url.length || url.charCodeAt(i) === 47) {

                const len = i - start;

                // STATIC FIRST
                let next = node.findChild(url, start, len);

                if (next) {
                    node = next;
                }

                // PARAM
                else if (node.paramChild) {

                    if (params !== null) {
                        params[node.paramChild.paramName] =
                            url.slice(start, i);
                    }
                    node = node.paramChild;
                }

                // WILDCARD
                else if (node.wildcardChild) {

                    params["*"] = url.slice(start);
                    node = node.wildcardChild;
                    break;
                }

                else {
                    return null;
                }

                start = i + 1;
            }

            i++;
        }

        if (!(node.methods & bit)) return null;

        return node.handlers[BIT_INDEX[bit]];
    }
}

module.exports = BangRouter;
