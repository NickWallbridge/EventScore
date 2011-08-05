/*
 Copyright (c) 2011 N D Wallbridge
 JavaScript Document
 */
var version = "0.1.0";
var undo = [];
var scoreData = [];

var jQT = $.jQTouch({
    icon : 'EEicon.png',
    icon4 : 'EEicon.png',
    startupScreen : 'EEstartup.png',
    useFastTouch : true,
    preloadImages : []
});
document.addEventListener("deviceready", onDeviceReady, false);
document.addEventListener('touchmove', function(e) { e.preventDefault();}, false); //not sure what this does

// PhoneGap is ready
//
function onDeviceReady() {
//    console.log('Phonegap Ready ...');
}

function doFilter(ring) {
    if (ring == undefined) {
        $('#mainList li').show();
        sortNum('.liNo');
    } else {
        //$('#mainList li').hide();
        $('#mainList li').each(function() {
            var $el = $(this);
            var elRing = $('.liRing', $el).text();
            if (elRing == ring) {
                $el.show();
            } else {
                $el.hide();
            }
        });
        sortNum('.liTotal');

    }
    setHeight();
}

function saveToLocal () {
    scoreData = [];
    $('#mainList li').each(function(i) {
        var $el = $(this);
        var ring = $('.liRing',$el).text();
        var num = $('.liNo',$el).text();
        var horse = $('.liHorse',$el).text();
        var rider = $('.liRider',$el).text();
        var dr = $("INPUT[name='dressage']",$el).val();
        var sj = $("INPUT[name='SJ']",$el).val();
        var xc = $("INPUT[name='XC']",$el).val();
        var xct = $("INPUT[name='XCT']",$el).val();

        scoreData.push([ring,num,horse,rider,dr,sj,xc,xct])

    });

    localStorage['EventScore_All']=JSON.stringify(scoreData);
}

function AjaxSucceeded(result) {
    alert('Success');
    scoreData = [];
    scoreData = JSON.parse(result.d);
//    alert(scoreData[0][0]);
    localStorage['EventScore_All']=result.d;
    loadFromLocal();
    doBindings();
}
function AjaxFailed(result) {
    alert(result.status + ' ' + result.statusText);
}

function loadFromRemote() {
            //try to load from remote
            $.ajax({
                type: "POST",
                url: "http://eventingedge.com/WSchecklist.asmx/EventScoreLoad",
                data: '{}',
                contentType: 'application/json; charset=UTF-8',
                dataType: 'json',
                async: false,
                success: AjaxSucceeded,
                error: AjaxFailed
            });

}

function loadFromLocal() {
    scoreData = [];
    try {
        scoreData = JSON.parse(localStorage['EventScore_All']);
        var $el = $('#mainList li:first-child').clone();
        if (scoreData.length > 0) {
            $('#mainList li').each(function(i) {
                $(this).remove();
            });
        }

        while (scoreData.length > 0) {
            $('.liRing',$el).text(scoreData[0][0]);
            $('.liNo',$el).text(scoreData[0][1]);
            $('.liHorse',$el).text(scoreData[0][2]);
            $('.liRider',$el).text(scoreData[0][3]);
            $("INPUT[name='dressage']",$el).val(scoreData[0][4]);
            $("INPUT[name='SJ']",$el).val(scoreData[0][5]);
            $("INPUT[name='XC']",$el).val(scoreData[0][6]);
            $("INPUT[name='XCT']",$el).val(scoreData[0][7]);
            doCalcTotal($("INPUT[name='XCT']", $el)[0], true);
            scoreData.shift();
            $el.show();
            $el.appendTo($('#mainList'));
            $el = $('#mainList li:first-child').clone();
        }

    } catch(e) {} //maybe no data

}

function doResetLocal() {
    localStorage.removeItem('EventScore_All');
}

function sortNum(selected) {
    if (selected == undefined) {
        selected = '.liNo';
    }
    var done = true;
    var max = $('#mainList li').length;
    var current = 1; //note nth-child is one based NOT zero!
    var $el;
    while (current <= max) {
        $el = $('#mainList li:nth-child('+current+')');
        var penalties = parseFloat($(selected, $el).text());
        if (isNaN(penalties)) {
            penalties = 999999;
        }
        var inserted = false;
        $('#mainList li').each(function(i , that){
            if (i >= current) {
                var $el2 = $(that);
                var penalties2 = parseFloat($(selected, $el2).text());
                if (isNaN(penalties2)) {
                    penalties2 = 999999;
                }
                if (penalties > penalties2) {
                    $el.insertAfter($el2);
                    inserted = true;
                    current = 0;
                    return false;
                }
            }
        });
        current++;
    }
    if (selected == '.liTotal') {
        //update position
        var position = 1;
        $('#mainList li').each(function(i , that){
            $el = $(this);
            if( $el.is(":visible") ) {
                $('.liPos', $el).text(position);
                position++;
            }
        });
    }

}
function doCalcTotal(that, noSave) {
    var $el = $(that).parent();  //div
    $el = $el.parent();  //li
    var dress = $("INPUT[name='dressage']", $el).val();
    var SJ = $("INPUT[name='SJ']", $el).val();
    var XC = $("INPUT[name='XC']", $el).val();
    var XCT = $("INPUT[name='XCT']", $el).val();
    var total = parseFloat(dress)+parseFloat(SJ)+parseFloat(XC)+parseFloat(XCT);
    if (isNaN(total)) {
        if (dress == 'E' || SJ == 'E' || XC == 'E' || XCT == 'E') {
            $('.liTotal', $el).text('ELIM');

        } else {
            $('.liTotal', $el).text('---');
        }
    } else {
        total = Math.floor(total * 10) / 10;
        $('.liTotal', $el).text(total);
    }
    if (noSave == undefined || ! noSave ) {
        saveToLocal();
    }
}

function editXCT(calledBy) {
    var stopTime = $('#editStop').val();
    var startTime = $('#editStart').val();
    var XCTime = $('#editXCTime').val();
    var mm;
    var ss
    if (calledBy == 'start' || calledBy == 'stop') {
        var startEl = startTime.split(":");
        var stopEl = stopTime.split(":");
        mm = parseInt(stopEl[1]) - parseInt(startEl[1]);
        ss = parseInt(stopEl[2]) - parseInt(startEl[2]);
    } else if (calledBy == 'time') {
        var timeEl = $('#editXCTime').val().split(":");
        mm = parseInt(timeEl[0]);
        ss = parseInt(timeEl[1])
    }

    if (ss < 0) {
        ss = ss + 60;
        mm--;
    }
    if (ss < 10) {
        ss = "0"+ss;
    }
    if (mm < 10) {
        mm = "0"+mm;
    }

    var optEl = $('#optimum').val().split(":");
    var compSecs = parseInt(mm)*60 + parseInt(ss);
    var optSecs = parseInt(optEl[0])*60 + parseInt(optEl[1]);
    var penSecs = compSecs - optSecs;
    var penalties = 0;
    if (penSecs > 0) {
        penalties = Math.floor(penSecs * 0.4 * 10) / 10;
    } else if(penSecs < -15) {
        penalties = (penSecs * -1) -15;
    }
    $('#editXCTime').val(mm+":"+ss);
    $('#editXCT').val(penalties);

}

function doCompStop(that) {
    var stopTime = $('#stopList li:first-child').text();
    if (stopTime == '') {
        stopTime = $('#theTime').text();  //do "immediate" stop
    }
    var $el = $(that);
    var startTime = $('.compStartTime',$el).text();
    var compNo = $('.compNo',$el).text();
    var startEl = startTime.split(":");
    var stopEl = stopTime.split(":");
    var optEl = $('#optimum').val().split(":");
    var mm = parseInt(stopEl[1]) - parseInt(startEl[1]);
    var ss = parseInt(stopEl[2]) - parseInt(startEl[2]);
    if (ss < 0) {
        ss = ss + 60;
        mm--;
    }
    if (ss < 10) {
        ss = "0"+ss;
    }
    if (mm < 10) {
        mm = "0"+mm;
    }
    var addClass = '';
    var compSecs = parseInt(mm)*60 + parseInt(ss);
    var optSecs = parseInt(optEl[0])*60 + parseInt(optEl[1]);
    var penSecs = compSecs - optSecs;
    var penalties = 0;
    if (penSecs > 0) {
        penalties = Math.floor(penSecs * 0.4 * 10) / 10;
        addClass = 'penaltiesRed';

    } else if(penSecs < -15) {
        penalties = (penSecs * -1) -15;
        addClass = 'penaltiesOrange';
    }



    $("<li><div class='compNo'>"+compNo+"</div><div class='penalties "+addClass+"'>"+penalties+"</div><div class='compTime'>"+mm+":"+ss+"</div><div class='compStopTime'>"+stopTime+"</div><div class='compStartTime'>"+startTime+"</div></li>").prependTo('#finishedList');
    $el.remove();
    $('#stopList li:first-child').remove();
    setHeight();

}
function doStart() {
    if ($('#competitorNo').val().length > 0 ) {
        var startTime = $('#theTime').text();
        var compNo = $('#competitorNo').val();
        $("<li onclick='doCompStop(this)' class='arrow'><div class='compNo'>"+compNo+"</div><div class='compStartTime'>"+startTime+"</div><div class='button gray dnf'>DNF</div></li>").appendTo('#runningList');
        $('#competitorNo').val('');
        setHeight();
    }
}

function doRemoveStop(that) {
    $(that).remove();
    setHeight();
}
function doStop() {
    var stopTime = $('#theTime').text();
    $("<li class='arrow' onclick='doRemoveStop(this)'><div class='stopTime'>"+stopTime+"</div></li>").appendTo('#stopList');
    setHeight();
}
function hhmmss(ms) {
    var dd = Math.floor(ms / (3600000 * 24));
    ms = ms - dd * (3600000 * 24); // drop days
    var hh = Math.floor(ms / 3600000);
    ms = ms - hh * 3600000;
    var mm = Math.floor(ms / (60000));
    ms = ms - mm *60000;
    var ss = Math.floor(ms/1000);
    if (ss < 10) {
        ss = "0"+ss;
    }
    if (mm < 10) {
        mm = "0"+mm;
    }

    hh++; //allow for BST
    return hh+":"+mm+":"+ss;
}

function timer() {
    var time = new Date();
    var ms = time.getTime();
    $('#theTime').text(hhmmss(ms));
}

function setHeight() {
//    console.log('setHeight ...');
//    setTimeout("$(window).resize()", 50);
}
var $currentEdit;
function saveEdit() {
    $("INPUT[name='XCT']", $currentEdit).val($("#editXCT").val());
    doCalcTotal($("INPUT[name='XCT']", $currentEdit)[0]);
    jQT.goBack();
}

function doBindings() {
    $("#mainList INPUT[type='number']").bind('change', function (evt, data) {
        doCalcTotal(this);
    });
    $("#mainList INPUT[type='number']").bind('click', function (evt, data) {
//        evt.preventDefault();
        evt.stopPropagation();
    });
    $("#mainList li").bind('click', function () {
        var $el = $(this);
        $currentEdit = $el;
        var competitor = $('.liNo', $el).text()+' '+$('.liHorse', $el).text()
        var XCT = $("INPUT[name='XCT']", $el).val();
        $('#competitor').text(competitor);
        $("#editXCT").val(XCT);
        jQT.goTo('#editrider')
    });

}
$(document).ready(function() {
    loadFromLocal();
    doBindings();
    setInterval("timer()",100);

});
// Some sample Javascript functions:
$(function() {
    $('a[target="_blank"]').click(function() {
        if(confirm('This link opens in a new window.')) {
            return true;
        } else {
            return false;
        }
    });
});

// This seems to run on equivalent of "$(document).ready(function() { });"
$(function() {
    //	$('#options .greenButton').click(hidePacked);
    //	$('#options .blueButton').click(showPacked);
    //	$('#options #reset').click(resetList);
    //	$('#options .whiteButton').click(setFilters);
    //	jQT.setPageHeight();
    // Orientation callback event
    //new NoClickDelay(document.getElementById('aBtnTest'));
    $('#home').bind('pageAnimationStart', function(e, info) {
//        console.log('Home Animate Start');

        /*
         if ($(window).width() > 430 + 150) {

         $('#mainList .liHorse').each(function(){
         $(this).removeClass('hide');
         });
         }
         if ($(window).width() > 430 + 300) {
         $('#mainList .liRider').each(function(){
         $(this).removeClass('hide');
         });
         }
         if ($(window).width() <= 430 + 150) {
         $('#mainList .liHorse').each(function(){
         $(this).addClass('hide');
         });
         }
         if ($(window).width() <= 430 + 300) {
         $('#mainList .liRider').each(function(){
         $(this).addClass('hide');
         });
         }
         */
        setHeight();
    });

});

function top() {

    setHeight();
}

function end() {

    setHeight();
}



