(function(window, $) {

    $.fn.infiniteScroll = function(options) {
        $(this).each(function(index, elem) {
            var transformedThis = this;
            if (elem.nodeType == 1) {
                var opts = $.extend({}, $.infiniteScroll.defaults, options)
                setTimeout((function() {
                    var x = initConfig.bind(transformedThis, elem);
                    x.call(elem);
                }).bind(transformedThis, elem), opts.delayStart);
            } else {
                console.log("Bounding infiniteScroll to ", elem, " is illegal");
            }
        })

        function initConfig(thisElem) {
            var self = selector = thisElem;
            self.isDataLoading = false;
            var opts = $.extend({}, $.infiniteScroll.defaults, options),
                dataCache = "",
                dataItems = "",
                ajaxData = "",
                errorMsg = "",
                itemsLoadedLen = 0,
                isDataLoading = false,
                totalNoOfItemsLength = 0,
                globalDataArr = [],
                bootStrapHacky = 10; // bootstrap hacky 
            opts.binder = thisElem;
            $(opts.binder).css('border', '1px solid transparent'); // bootstrap hacky 
            opts.overrideCareInitLoad = false;
            opts.stopAjax = false;
            var obj = {};
            obj['elem'] = thisElem;
            obj['opts'] = opts;
            elemOptsMatcher.push(obj);
            initScroller(self, opts);
            if (opts.scrollTopOnReload) {
                window.onunload = function() {
                    window.scrollTo(0, 0);
                }
            }

            function exceptionHandler(errCode, data) {
                var exceptionObject = {};
                exceptionObject.suppliedType = "Inappropriate Error code";
                exceptionObject.suppliedMsg = "No Exception Found";
                switch (errCode) {
                    case 001:
                        { //00X - Invalid Input
                            exceptionObject.suppliedType = 'option.fetchItemsData contains \'?\' at ' + opts.fetchItemsData.indexOf('?');
                            exceptionObject.suppliedMsg = " If {isServerDataFetch:true}, option.fetchItemsData should contain only hostname (location.host), query string is to be separated it with option.serverFetchParams --> " + exceptionObject.suppliedType + " ";
                            exceptionObject.errCode = "Internal Error Code (Invalid Input Status Follows 00X) --> " + 001;
                            break;
                        }
                    case 010:
                        { //0X0 - Unreachable Object Tree
                            exceptionObject.suppliedType = opts.objectProcessor;
                            exceptionObject.suppliedMsg = "  Specified 'objectProcessor' in options --> \"" + exceptionObject.suppliedType + "\" is not found with the fetched data. ";
                            exceptionObject.errCode = "Internal Error Code (Unreachable Object Tree Status Follows 0X0) --> " + 010;
                            break;
                        }
                    case 002:
                        { //00X - Invalid Input
                            exceptionObject.suppliedType = Object.prototype.toString.call(opts.fetchItemsData).slice(8, -1);
                            exceptionObject.suppliedMsg = "Input Expected as (array or valid json). But supplied --> " + exceptionObject.suppliedType + " ";
                            exceptionObject.errCode = "Internal Error Code (Invalid Input Status Follows 00X) --> " + 002;
                            break;
                        }
                    case 100:
                        { //X00 - Network Data Status - Success
                            exceptionObject.suppliedType = opts.fetchItemsData + '?' + (typeof(opts.serverFetchParams) != "undefined") ? opts.serverFetchParams : "";
                            exceptionObject.suppliedMsg = "Network Data Response from --> " + exceptionObject.suppliedType + " results with status " + data.status + " ";
                            exceptionObject.errCode = "Internal Error Code (Network Data Status -- Success -- Follows X00) --> " + 100;
                            break;
                        }
                    case 200:
                        { //X00 - Network Data Status - Error
                            exceptionObject.suppliedType = opts.fetchItemsData + '?' + (typeof(opts.serverFetchParams) != "undefined") ? opts.serverFetchParams : "";
                            exceptionObject.suppliedMsg = "Network Data Response From --> " + exceptionObject.suppliedType + " results with status " + data.status + " ";
                            exceptionObject.errCode = "Internal Error Code (Network Data Status -- Failure -- Follows X00) --> " + 200;
                            break;
                        }
                    default:
                        throw exceptionObject;
                }
                throw exceptionObject;
            }
            try {
                if (opts.isServerDataFetch) { //server end infinite scroll
                    var dataArr = [];
                    globalDataArr = dataArr;
                    if (opts.fetchItemsData.indexOf('?') != -1) {
                        exceptionHandler(001);
                    }
                    if ($.infiniteScroll.serverFetchParams != "") {
                        opts.serverFetchParams = $.extend({}, options.serverFetchParams, $.infiniteScroll.serverFetchParams);
                    }

                    function doAjax() {
                        $(opts.loaderDOM).show();
                        opts.binder.isDataLoading = true;
                        ajaxData = $.ajax({
                                url: opts.fetchItemsData + '?' + opts.serverFetchParams,
                                crossDomain: true,
                                dataType: 'jsonp',
                                complete: function(data) {
                                    $(opts.loaderDOM).hide();
                                },
                                error: function(data, statusTxt, resObj) {
                                    try {
                                        $(opts.loaderDOM).hide();
                                        exceptionHandler(200, resObj);
                                    } catch (e) {
                                        console.log(e.errCode);
                                    }
                                },
                                success: function(data, statusTxt, resObj) {
                                    try {
                                        $(opts.loaderDOM).hide();
                                        exceptionHandler(100, resObj);
                                    } catch (e) {
                                        console.log(e.errCode);
                                    }
                                },
                            })
                            .done(function(data) {
                                opts.binder.isDataLoading = false;
                                itemsLoadedLen = Math.min(opts.noOfItems, data.length);
                                totalNoOfItemsLength = data.length;
                                dataItems = data;
                                dataArr = dataItems.slice(0, itemsLoadedLen);
                                globalDataArr = dataArr;
                                if (data.length == 0) {
                                    opts.stopAjax = true;
                                }
                                if (!opts.careInitLoad || opts.overrideCareInitLoad) {
                                    opts.domBuilder.call(this, self, [], dataItems);
                                    opts.resultData.call(this, dataArr);
                                    opts.overrideCareInitLoad = true;
                                } else {
                                    opts.resultData.call(this, dataArr);
                                    opts.domBuilder.call(this, self, dataArr, dataItems);
                                    itemsLoadedLen = Math.min(opts.noOfItems, data.length);
                                }
                                if (!opts.binder.isDataLoading) {
                                    $.event.trigger({
                                        type: "dataResolved"
                                    }, {
                                        message: {
                                            "targetElem": opts.binder,
                                            "scrollableElem": self
                                        }
                                    });
                                }
                            });
                    }
                    doAjax();
                } else { // client end infinite scroll
                    if (typeof opts.fetchItemsData == "string" && opts.fetchItemsData.search(/(\.json)/) != -1) {
                        dataCache = $.getJSON(opts.fetchItemsData).done(function(data) {
                            itemsLoadedLen = Math.min(opts.noOfItems, data.length);
                            totalNoOfItemsLength = data.length;
                            dataItems = data;
                            var dataArr = [];
                            dataArr = dataItems.slice(0, itemsLoadedLen);
                            globalDataArr = dataArr;
                            opts.binder.isDataLoading = true;
                            if (!opts.careInitLoad || opts.overrideCareInitLoad) {
                                opts.domBuilder.call(this, self, [], dataItems);
                                opts.resultData.call(this, dataArr);
                                opts.overrideCareInitLoad = true;
                            } else {
                                opts.resultData.call(this, dataArr);
                                opts.domBuilder.call(this, self, dataArr, dataItems);
                                itemsLoadedLen = Math.min(opts.noOfItems, data.length);
                            }
                            opts.binder.isDataLoading = false;
                        });
                    } else if (Array.isArray(opts.fetchItemsData)) {
                        dataCache = opts.fetchItemsData;
                        dataItems = data;
                        itemsLoadedLen = Math.min(opts.noOfItems, data.length);
                        totalNoOfItemsLength = dataCache.length;
                        var dataArr = [];
                        dataArr = dataItems.slice(0, itemsLoadedLen)
                        globalDataArr = dataArr;
                        opts.binder.isDataLoading = true;
                        if (!opts.careInitLoad || opts.overrideCareInitLoad) {
                            opts.domBuilder.call(this, self, [], dataItems);
                            opts.resultData.call(this, dataArr);
                            opts.overrideCareInitLoad = true;
                        } else {
                            opts.resultData.call(this, dataArr);
                            opts.domBuilder.call(this, self, dataArr, dataItems);
                            itemsLoadedLen = Math.min(opts.noOfItems, data.length);
                        }
                        opts.binder.isDataLoading = false;
                    } else if (typeof opts.fetchItemsData == "string" && opts.fetchItemsData.search(/(http:\/\/|https:\/\/)/) != -1) {
                        $(opts.loaderDOM).show();
                        opts.binder.isDataLoading = true;
                        ajaxData = $.ajax({
                            url: opts.fetchItemsData,
                            dataType: 'jsonp',
                            crossDomain: true,
                            complete: function(data) {
                                $(opts.loaderDOM).hide();
                            },
                            error: function(data, statusTxt, resObj) {
                                try {
                                    $(opts.loaderDOM).hide();
                                    exceptionHandler(200, resObj);
                                } catch (e) {
                                    console.log(e.errCode);
                                }
                            },
                            success: function(data, statusTxt, resObj) {
                                try {
                                    $(opts.loaderDOM).hide();
                                    exceptionHandler(100, resObj);
                                } catch (e) {
                                    console.log(e.errCode, data);
                                }
                            }
                        }).done(function(data) {
                            opts.binder.isDataLoading = false;
                            var objPreProcessor = [];
                            if (opts.objectProcessor.indexOf('.') != -1) {
                                objPreProcessor = opts.objectProcessor.split('.');
                            } else {
                                objPreProcessor.push(opts.objectProcessor);
                            }
                            var dataDuplication = data;
                            try {
                                if (Object.prototype.toString.call(data).slice(8, -1) != "Array") {
                                    for (var i = 0; i < objPreProcessor.length; i++) {
                                        if (dataDuplication.hasOwnProperty(objPreProcessor[i])) {
                                            objValidation = true;
                                            dataDuplication = dataDuplication[objPreProcessor[i]];
                                        } else {
                                            objValidation = false;
                                            exceptionHandler(010);
                                            break;
                                        }
                                    }
                                }
                                dataCache = dataDuplication;
                                if (!objValidation) {
                                    exceptionHandler(010);
                                }
                            } catch (e) {
                                console.log('%c %s', 'color:#FFFFFF;background-color:#D60000;font-size:16px;', e.suppliedMsg);
                            }
                            itemsLoadedLen = dataCache.length;
                            dataItems = dataCache;
                            itemsLoadedLen = Math.min(opts.noOfItems, data.length);
                            totalNoOfItemsLength = dataCache.length;
                            var dataArr = [];
                            dataArr = dataItems.slice(0, itemsLoadedLen)
                            globalDataArr = dataArr;
                            if (!opts.careInitLoad || opts.overrideCareInitLoad) {
                                opts.domBuilder.call(this, self, [], dataItems);
                                opts.resultData.call(this, dataArr);
                                opts.overrideCareInitLoad = true;
                            } else {
                                opts.resultData.call(this, dataArr);
                                opts.domBuilder.call(this, self, dataArr, dataItems);
                                itemsLoadedLen = Math.min(opts.noOfItems, data.length);
                            }
                        });
                    } else {
                        exceptionHandler(002);
                    }
                }
            } catch (e) {
                console.log('%c %s', 'color:#FFFFFF;background-color:#D60000;font-size:16px;', e.suppliedMsg);
            }

            /// start scrolling - within config
            function initScroller(elem, opts) {
                if ((elem.scrollHeight > elem.offsetHeight) || (elem.scrollHeight > elem.offsetHeight + bootStrapHacky)) {
                    opts.scrollByContainer = true;
                } else {
                    opts.scrollByContainer = false;
                }

                var self = (opts.scrollByContainer) ? (function() {
                    domDim = elem.getBoundingClientRect();
                    return elem;
                })() : window;

                $(self).on('scroll', scrollHandler);

                // load content on scroll begins
                function loadContentOnScroll(elem) {
                    itemsLoadedLen1 = (((!isNaN(itemsLoadedLen) ? itemsLoadedLen : (itemsLoadedLen = 0)) + opts.noOfItems) < dataItems.length) ? (itemsLoadedLen + opts.noOfItems) : dataItems.length;
                    dataArr = [];
                    dataArr = dataItems.slice(itemsLoadedLen, itemsLoadedLen1)
                    globalDataArr = dataArr;
                    opts.domBuilder.call(this, elem, dataArr, dataItems);
                    opts.resultData.call(this, dataArr);
                    itemsLoadedLen = itemsLoadedLen1;
                }
                // load content on scroll ends

                //scroll handler begins
                function scrollHandler() {
                    var bodyDim = document.body.getBoundingClientRect();
                    var scrollTop = (navigator.userAgent.indexOf('MSIE') != -1) ? /*(parseInt(document.documentElement.scrollTop) - 1)*/ window.pageYOffset : document.body.scrollTop;

                    if (document.body.clientHeight - window.innerHeight <= scrollTop || document.body.scrollHeight - window.innerHeight <= scrollTop) {
                        $.event.trigger({
                            type: "reachedDocumentEnd"
                        }, {
                            message: {
                                "targetElem": opts.binder,
                                "scrollableElem": self
                            },
                        });

                        // induce scroll to document otherwise scroll event fails which is a blocking condition
                        scrollTop = scrollTop - 10;
                        window.scrollTo(0, scrollTop);
                    }

                    domDim = elem.getBoundingClientRect();
                    if (self != window) {
                        prev = domDim.scrollTop;
                        var domHeightDiff = Math.max(elem.scrollHeight, elem.offsetHeight, elem.clientHeight) - window.innerHeight,
                            domScrolledTop = elem.scrollTop + (elem.offsetHeight - window.innerHeight),
                            scrollerHeightDiff = domHeightDiff,
                            scrollerTop = domScrolledTop;
                    } else {
                        prev = document.body.scrollTop;
                        var docHeightDiff = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, document.body.offsetHeight, document.documentElement.offsetHeight, document.body.clientHeight, document.documentElement.clientHeight) - window.innerHeight,
                            docScrolledTop = document.body.scrollTop,
                            scrollerHeightDiff = docHeightDiff,
                            scrollerTop = docScrolledTop;
                    }
                    var itemsLoadedLen1 = 0;
                    if ((scrollerTop == scrollerHeightDiff) || (domDim.bottom <= window.innerHeight)) {
                        if ((elem.scrollHeight == elem.clientHeight) || (elem.scrollHeight == (elem.clientHeight + bootStrapHacky))) { //no scrollbar
                            loadContentOnScroll.call(this, elem);
                        } else { //contains scrollbar
                            if (((elem.scrollHeight - elem.scrollTop)) == elem.clientHeight || ((elem.scrollHeight - elem.scrollTop) == elem.clientHeight + bootStrapHacky)) {
                                loadContentOnScroll.call(this, elem);
                            }
                        }
                        dataArr = globalDataArr;
                        if (dataArr.length > 0) {
                            $.event.trigger({
                                type: "scrollReachedLimit"
                            }, {
                                message: {
                                    "so far loaded": itemsLoadedLen,
                                    "targetElem": opts.binder,
                                    "scrollableElem": self
                                }
                            });
                        } else {
                            $.event.trigger({
                                type: "scrollReachedEnd"
                            }, {
                                message: {
                                    "data load completed": itemsLoadedLen,
                                    "targetElem": opts.binder,
                                    "scrollableElem": self
                                },
                            });
                            if (opts.isServerDataFetch) {
                                if (!opts.binder.isDataLoading) {
                                    opts.serverFetchParams = $.infiniteScroll.serverFetchParams;
                                    if (!opts.stopAjax)
                                        doAjax();
                                }
                            }
                        }
                    }
                }
                //scroll handler ends
            }
            /// end scrolling
        }
    }
    var elemOptsMatcher = [];
    $.infiniteScroll = {
        'init': function() {
            $.infiniteScroll.avoidNSConflict();
        },
        'avoidNSConflict': function(duplicate) {
            $.fn.infiniteScroll = (typeof duplicate != "undefined") ? ($.fn[duplicate] = $.fn.infiniteScroll) : $.fn.infiniteScroll;
            $.infiniteScroll = (typeof duplicate != "undefined") ? ($[duplicate] = $.infiniteScroll) : $.infiniteScroll;
        },
        'author': 'MOGAN KUMAR PC',
        'version': '1.0',
        'serverFetchParams': '',
        'defaults': {
            'fetchItemsData': '',
            'noOfItems': 5,
            'isServerDataFetch': false,
            'scrollByContainer': false,
            'careInitLoad': false,
            'serverFetchParams': "",
            'resultData': function(data) {},
            'objectProcessor': '',
            'domBuilder': function(self, data, itemsLoadedLen) {},
            'loaderDOM': '',
            'scrollTopOnReload': false,
            'delayStart': 0
        }
    }

    $.infiniteScroll.init();
})(window, jQuery, undefined);