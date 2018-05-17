
 
var regex = /[a-zA-Z\u00C0-\u017F]+/g;

/**
 * 
 * @param {string} arg 
 */
export function wordSeparator(arg) {
    return arg.match(regex);
}

/**
 * 
 * @param {RegExpMatchArray} args
 * @returns {{counter: number, word: string }[]}
 */
export function wordCounter(args) {
    /**
     * @type {{counter: number, word: string }[]}
     */
    var result = [];
    
    args.forEach(arg => {
        var found = false;
        for(let r of result) {
            if(r.word == arg) {
                r.counter ++;
                found = true;
                break;
            }
        }

        if(!found) {
            result.push({
                counter: 1,
                word: arg
            });
        }
    })

    return result;
}