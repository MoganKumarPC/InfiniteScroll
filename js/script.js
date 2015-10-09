$.infiniteScroll.avoidNSConflict('iPCScroll');

function appendItems1(self, data, dataArr) {
    for (var i = 0; i < data.length; i++) {
        $(self).append("<p> <strong>" + data[i].collectionName +" -- "+(data[i].artistName) + "</strong><br/><img src="+data[i].artworkUrl100+" alt = "+data[i].artworkUrl100+"/></p>")
    }
}

function appendItems2(self, data, dataArr) {
    for (var i = 0; i < data.length; i++) {
        $(self).append("<p><strong>" + data[i].name + "</strong>&nbsp;<em>"+data[i].code+"</em</p>")
    }
}

function appendItems3(self, data, dataArr) {
    for (var i = 0; i < data.length; i++) {
        $(self).append("<p class= 'txt-align-cntr'><strong>" + data[i].description + "</strong><p/><p class= 'txt-align-cntr'><img src='"+data[i].images['237x'].url + "' alt = '"+ data[i].images['237x'].url + "'/></p>");
    }
}

function appendItems4(self, data, dataArr) {
    for (var i = 0; i < data.length; i++) {
        $(self).append("<p>" + data[i].f + "</p>")
    }
}

function partialResults(data) {
    console.log(data);
}

/*** 1. Server Data Fetch & client Data scroll with internal scrollbar- Config Begins ***/

$('.i-scroll-container1').iPCScroll({
    fetchItemsData: 'https://itunes.apple.com/search?term=ar+rahman',
    noOfItems: 5,
    isServerDataFetch: false,
    domBuilder: appendItems1,
    careInitLoad: true,
    objectProcessor: 'results',
    resultData: partialResults
});

/*** 1. Server Data Fetch & client Data scroll with internal scrollbar - Config Ends ***/

////////////////////////////////////////////////////////////////////////////////////////

/*** 2. Local Data Fetch & client Data scroll - Config Begins ***/

$('.i-scroll-container2').iPCScroll({
    fetchItemsData: 'data/staticData.json', //JSON Data is from <https://gist.github.com/Keeguon/2310008>
    noOfItems: 6,
    isServerDataFetch: false,
    domBuilder: appendItems2,
    // careInitLoad: true,
    resultData: partialResults,
    delayStart: 3000
});

/*** 2. Local Data Fetch & client Data scroll - Config Ends ***/

////////////////////////////////////////////////////////////////////////////////////////


/*** 3. Server Data Fetch & client Data scroll - Config Begins ***/

$('.i-scroll-container3').iPCScroll({
    fetchItemsData: 'https://api.pinterest.com/v3/pidgets/boards/FisherPrice/for-my-baby/pins/',
    noOfItems: 5,
    isServerDataFetch: false,
    domBuilder: appendItems3,
    // careInitLoad: true,
    objectProcessor: 'data.pins',
    loaderDOM: '#loader',
    resultData: partialResults
});

/*** 3. Server Data Fetch & client Data scroll - Config Ends ***/

/////////////////////////////////////////////////////////////////////////////////////////////

/*** 4. Server Data Fetch, persistent Data fetch & client Data scroll - Config Begins ***/

$('.i-scroll-container4').iPCScroll({
    fetchItemsData: 'http://www.filltext.com/',
    noOfItems: 5,
    isServerDataFetch: true,
    domBuilder: appendItems4,
    // careInitLoad: true,
    resultData: partialResults,
    serverFetchParams: 'rows=20&f={firstName}',
    loaderDOM: '#loader',
    scrollTopOnReload:true
});

/*** temporary scenario emulation code begins ***/

// This is to emulate the end condition of infinite scroll (not necessary)
var x = true;
setTimeout(function() {
    // set x to false to emulate such scenario
        //x = false;        
}, 30000); //enabling infinite scroll upto 30 seconds then deactivate data population

/*** temporary scenario emulation code ends ***/

/*** 4. Server Data Fetch, persistent Data fetch & client Data scroll - Config Ends ***/

/////////////////////////////////////////////////////////////////////////////////////////////

/*** Custom Events triggered to provide developer interaction - Begins ***/

$(document).on('scrollReachedLimit', function(event, data, msg, thrd) {
    if ($(data.message.targetElem).hasClass('i-scroll-container4')) {
        //console.log('container-4 reached limit, try to fetch more');
    }
});

$(document).on('scrollReachedEnd', function(event, data) {
    (function() {
        // This is to emulate the end condition of infinite scroll (not necessary in real-time)
        var randNum = Math.ceil(Math.random() * 50);
        var str = (x) ? 'rows=' + randNum + '&f={firstName}' : '';
        $.iPCScroll.serverFetchParams = str;
        return str;
    })();
    if ($(data.message.targetElem).hasClass('i-scroll-container4')) {
        //console.log('container-4 reached end, no more data to fetch');
    }

    //console.log('completely loaded the contents of at least one container...')
});

/*** Custom Events triggered to provide developer interaction - Ends ***/

// A Theme switcher Method to change the theme


$('#themeSwitcher').on('click', function(){
if($(this).hasClass('on')){
    $('#theme').get(0).href = $('#theme').get(0).href.substring(0,$('#theme').get(0).href.lastIndexOf('/')) + '/bootstrap-theme-1.css';    
    $(this).removeClass('on');
}
else{
    $('#theme').get(0).href = $('#theme').get(0).href.substring(0,$('#theme').get(0).href.lastIndexOf('/')) + '/bootstrap-theme.css';    
    $(this).addClass('on');
}
});



//Below code is just a tricky hack to induce scroll event when the page is not eligible to scroll 
window.onload = function(){
    if(document.body.clientHeight <= window.innerHeight){
        console.log(document.body.clientHeight)
        document.body.style.marginBottom = (window.innerHeight - document.body.clientHeight) + 10 + "px";
    }
}