import { Observable, OperatorFunction } from 'rxjs';
import { filter } from 'rxjs/operators';
import { TextMessage } from '@comen/gamma';
import { ComenMessage } from './message';

export function commentFilter(config: {
    userBlacklist: number[],
    wordBlacklist: string[],
    minGiftValue: number,
    levelFilter: number,
    typeFilterControlBit: number
}): OperatorFunction<ComenMessage, ComenMessage> {
    return (upstream) => upstream.pipe(filter(comment => {
        if ('platformUserId' in comment) {
            if (config.userBlacklist.indexOf(comment.platformUserId) != -1) {
                return false;
            }
        }
        if ('content' in comment) {
            if (config.wordBlacklist.some(s => {
                return comment.content.indexOf(s) != -1;
            })) {
                return false;
            }
        }
        if (config.levelFilter>0&&'platformUserLevel' in comment&&comment.platformUserLevel<config.levelFilter) {
            return false;
        }
        if ('price' in comment && comment.price < config.minGiftValue) {
            return false;
        }
        if (comment.type == 'text' && config.typeFilterControlBit & 0b1) {
            return false;
        }
        if (comment.type == 'sticker' && config.typeFilterControlBit & 0b10) {
            return false;
        }
        if (comment.type == 'paid' && config.typeFilterControlBit & 0b100) {
            return false;
        }
        if (comment.type == 'member' && config.typeFilterControlBit & 0b1000) {
            return false;
        }
        return true;
    }));
}

export function smoother(config: {
    disableSmoother: boolean,
}): OperatorFunction<ComenMessage, ComenMessage> {
    return (upstream) => {
        if (config.disableSmoother) {
            return upstream;
        }
        return new Observable(observer => {
            const messageBuffer = [] as TextMessage[];
            (async () => {
                while (!observer.closed) {
                    if (messageBuffer.length) {
                        observer.next(messageBuffer.shift());
                        const time = performance.now();
                        for (let i = 0; i < 12 - (messageBuffer.length * 0.4)/* pressure */; i++) {
                            await nextFrame();
                        }
                    }
                    await nextFrame();
                }
            })();

            return upstream.subscribe(comment => {
                if (comment.type == 'text') {
                    messageBuffer.push(comment);
                } else {
                    // ignore non text comment
                    observer.next(comment);
                }
            });
        })
    }
}

export function folder(config: {
    groupSimilar: boolean,
    groupSimilarWindow: number
}): OperatorFunction<ComenMessage, ComenMessage> {
    return (upstream) => {
        if (!config.groupSimilar) {
            return upstream;
        }
        return new Observable(observer => {
            return upstream.subscribe(comment => {
                if (comment.type === 'text') {
                    // folding logic
                    observer.next(comment);
                } else {
                    // ignore non text comment
                    observer.next(comment);
                }
            })
        })
    }
}

function nextFrame() {
    return new Promise(res => {
        requestAnimationFrame(res);
    })
}