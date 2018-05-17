
import HTMLParser                     from './HTMLParser';
import {wordCounter, wordSeparator}   from './keyword';
import {MySQLService} from './SqlService';

export class MetaService
{
    /**
     * 
     * @param {any} collection 
     * @param {HTMLParser} parser 
     * @param {MySQLService} sqlService
     */
    constructor(collection, parser, sqlService) {
        this.collection = collection;
        this.parser = parser;
        this.sqlService = sqlService;
    }

    mongoGetByIdPromise(id){
        return new Promise((resolve, reject) => {
            try
            {
                this.collection.findById(id, function(fetchError, result) {
                    if(fetchError) {
                        reject(fetchError);
                        return;
                    }
    
                    resolve(result);
                });
            }
            catch(e)
            {
                reject(e);
            }
        });
    }

    run(id) {
        var page_SQL_id;
        return this.mongoGetByIdPromise(id)
            .then(result => {
                page_SQL_id = result.page_SQL_id;
                return result;
            })
            .then(this.getHtml.bind(this))
            .then(this.parse.bind(this))
            .then(this.countKeyword.bind(this))
            .then((result) => {
                this.saveResult(result, page_SQL_id);
            })
            .catch(this.logError.bind(this));
    }

    getHtml(result) {
        if (!result) {
            throw new Error("No spider result for id "+ spiderResultId + ".");
        }

        var html = result.html
        if (!html) {
            throw new Error("No spider html found in the spider result "+ JSON.stringify(result) + ".");
        }

        return html;
    }

    parse(html) {
        return this.parser.getResults(html);
    }

    countKeyword(metas) {
        metas.forEach(meta => {
            meta.keywords = wordCounter(wordSeparator(meta.content));
        });
        return metas;
    }

    saveResult(result, page_SQL_id) {
        this.sqlService.save(page_SQL_id, result);
    }

    logError(err) {
        console.error(err);
    }
}