export function secondToTime(second) {
    const hour = Math.floor(second / 3600);
    const min = Math.floor((second - hour * 3600) / 60);
    return `${hour ? hour + '小时' : ''}${min}分钟`;
}

export function allChannelSubscribed(channels, subList){
    if(channels === undefined || channels.length === 0 || subList === undefined || subList.length === 0){
        return false;
    }
    let allSubcribe = true;
    channels.forEach(channel =>{
        if(subList.indexOf(channel) < 0){
            allSubcribe = false;
            return allSubcribe;
        }
    });
    return allSubcribe;
}

const iframe = document.querySelector('#sandbox');
const returnResults = [];
window.addEventListener('message', (event) => {
    returnResults.forEach((returnResult) => {
        returnResult(event);
    });
});
export function commandSandbox(command, data, callback) {
    if (data.rules && typeof data.rules === 'object') {
        try {
            callback(iframe.contentWindow[command](data));
            return;
        } catch (e) {
            // nothing
        }
    }
    iframe.contentWindow.postMessage(
        {
            command: command,
            data: data,
        },
        '*'
    );

    const myReturn = (event) => {
        if (event.data.origin.command === command && (!data.url || event.data.origin.data.url === data.url)) {
            returnResults.splice(returnResults.indexOf(myReturn), 1);
            if (event.data && event.data.result) {
                callback(event.data.result);
            }
        }
    };
    returnResults.push(myReturn);
}
