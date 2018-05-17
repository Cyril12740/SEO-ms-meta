import { JSDOM } from "jsdom";

const metaFilter = [
    'title', 'description', 'charset'
]

class HTMLParser {
    /**
     * 
     * @param {string} html 
     * @returns {{content: string, length: number, type: string}[]}
     */
    getResults(html) {
        var metas = [];

        var dom = new JSDOM(html);

        dom.window.document.querySelectorAll('meta').forEach(meta => {
            if(meta.attributes['charset']) {
                var test = meta.attributes['charset'];
                metas.push({
                    content: meta.attributes['charset'].value,
                    length: meta.attributes['charset'].value.length,
                    type: 'charset'
                });
            }
            else if(meta.attributes['name']) {
                metas.push({
                    content: meta.content,
                    length: meta.content.length,
                    type: meta.attributes['name'].value
                });
            }
        });

        return metas.filter(meta => metaFilter.indexOf(meta.type) > 0);
    }
}

export default HTMLParser;