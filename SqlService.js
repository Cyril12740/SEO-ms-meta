export class MySQLService {

    constructor(connection, isDebug = true) {
        this.isDebug = isDebug;
        this.connection = connection;
    }

    /**
     * 
     * @param {number} pageId 
     * @param {{content: string, length: number, type: string, keywords: any[]}[]} results 
     */
    save(pageId, metas) {
        return Promise.all(metas.map((meta) => {
            this.saveMeta(pageId, meta);
        }));
    }

    /**
     * 
     * @param {number} pageId 
     * @param {{content: string, length: number, type: string, keywords: any[]}} meta 
     */
    saveMeta(pageId, meta) {
        this.query('INSERT INTO Meta(Content, Length, type, pageId) VALUES (?, ?, ?, ?)', [
            meta.content,
            meta.length,
            meta.type,
            pageId
        ])
        .then((result) => {
            //save keyword
            return Promise.all(meta.keywords.map(keyword => {
                this.saveKeyword(result.insertId, keyword);
            }));
        });
    }

    saveKeyword(metaId, keyword) {
        return this.query("insert into MetaKeyword  (Content, Occurence, MetaId) VALUES (?, ?, ?)", [
            keyword.word,
            keyword.counter,
            metaId
        ]);
    }

    query(query, params) {
        if(this.isDebug) {
            console.log(`SQL QUERRY : ${query}`, params);
        }
        return new Promise((resolve, reject) => {
            this.connection.query(query, params, (error, results, fields) => {
                if(error) {
                    reject(error);
                    return;
                }
                resolve(results);
            });
        });
    }

    sendResults(results, success, error){
          
        this.sendResult(results, 0, success, error);

        this.c.end();
    }

    sendResult(results, index, success, error) {
        var result = results[index];
        if (!result) {
            success();
            return;
        }

        var selectQuery = "SELECT ID FROM KEYWORD WHERE PAGE_ID = "+ result.pageId +" AND CONTENT = '"+ result.content.replace(/\'/g, '\\\'') +"'";

        this.c.query(selectQuery, (err, rows) => {
            if (err) {
                error(err);
                return;
            }

            if (rows[0] && rows[0].ID) {
                var query = "UPDATE KEYWORD SET DENSITY_PAGE = "+ result.densityPage +", LAST_DATE = '"+ this.getCurrentSQLFormatedDate() +"' WHERE ID = "+ rows[0].ID
            }
            else {
                var query = "INSERT INTO KEYWORD (PAGE_ID,CONTENT,DENSITY_PAGE, LAST_DATE) VALUES ("+ result.pageId +", '"+ result.content.replace(/\'/g, '\\\'') +"', "+ result.densityPage +", '"+ this.getCurrentSQLFormatedDate() +"');"
            }

            console.log(query);
            this.c.query(query, (err, rows) => {
                if (err) {
                    error(err);
                    return;
                }
                // console.log(query + " \n"+ rows);
                this.sendResult(results, ++index, success, error);
            });
            
        })

        
    }

    getCurrentSQLFormatedDate() {
        var date;
        date = new Date();
        date = date.getUTCFullYear() + '-' +
            ('00' + (date.getUTCMonth() + 1)).slice(-2) + '-' +
            ('00' + date.getUTCDate()).slice(-2) + ' ' +
            ('00' + date.getUTCHours()).slice(-2) + ':' +
            ('00' + date.getUTCMinutes()).slice(-2) + ':' +
            ('00' + date.getUTCSeconds()).slice(-2);

        return date;
    }

}
