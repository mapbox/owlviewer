var mode;
var map;
var changesets = [];
var templates;
var show;
var customSettings = false; // If true, user changed something in default settings (mode, timelimit etc).

function setModeForZoomLevel() {
    if (!customSettings) {
        if (map.getZoom() >= 16) {
            switchMode('GEOJSON', false);
        } else if (map.getZoom() >= 12) {
            switchMode('BBOXES', false);
        } else {
            switchMode('SUMMARY', false);
        }
    }
}

// Updates feed link by generating the URL based on tile range for the currently visible viewport.
function updateFeedLink() {
    var bounds = map.getPixelBounds(),
      nwTilePoint = new L.Point(
        Math.floor(bounds.min.x / markers.options.tileSize),
        Math.floor(bounds.min.y / markers.options.tileSize)),
      seTilePoint = new L.Point(
        Math.floor(bounds.max.x / markers.options.tileSize),
        Math.floor(bounds.max.y / markers.options.tileSize));

    $('#feed_link').attr('href', $.owlviewer.owl_api_url + 'changesets/'
        + map.getZoom() + '/'
        + nwTilePoint.x + '/' + nwTilePoint.y + '/'
        + seTilePoint.x + '/' + seTilePoint.y + '.atom'
    );
}

function resetChangesetList() {
    if (mode == 'GEOJSON') {
        setChangesetsFromGeoJSON();
    } else if (mode == 'SUMMARY') {
        setChangesetsFromSummaryTiles();
    }
}

function addChangeset(changeset) {
    if (!changeset) { return; }
    changesets.push(changeset);
}

function updateChangesetList() {
    function getChangesetIdFromListElement(el) {
        if (el.id.length == 0) {
            // Try parent element.
            el = el.parentElement;
            if (el.id.length == 0) {
                return null;
            }
        }
        return parseInt(el.id.split('-')[1]);
    }

    $('#changesets').empty();
    _(changesets)
        .chain()
        .reduce(function(m, f) {
            m[f.id] = f;
            return m;
        }, {})
        .sortBy(function(p) {
            return p.id * -1;
        })
        .each(function(p) {
            $('#changesets').append(templates.changeset(p));
        });

    // Hover event handling.
    $('.changeset').hover(function(e) {
        var changeset_id = getChangesetIdFromListElement(e.target);
        highlightGeoJSON(changeset_id);
        highlightBbox(changeset_id);
        //var details_el = $(e.target).children('div[class=stats]');
        //e.type == "mouseenter" ? details_el.show() : details_el.hide();
    }, function(e) {
        var changeset_id = getChangesetIdFromListElement(e.target);
        unhighlightGeoJSON(changeset_id);
        unhighlightBbox(changeset_id);
    });

    // Click event handling.
    $('.changeset').on('click', function(e) {
        enableCustomSettings();
        var changeset_id = getChangesetIdFromListElement(e.target);
        deactivateChangeset(inspectedChangesetId);
        inspectedChangesetId = changeset_id;
        switchMode('CHANGESET', true);
    });
}

function highlightChangeset(id) {
    $('#changeset-' + id).addClass('highlight');
}

function unhighlightChangeset(id) {
    $('#changeset-' + id).removeClass('highlight');
}

function activateChangeset(id) {
    $('#changeset-' + id).addClass('highlight');
}

function deactivateChangeset(id) {
    $('#changeset-' + id).removeClass('highlight');
}

function getTimelimit() {
    return parseInt($("#status_timelimit").val());
}

// Loads center and zoom from a cookie.
function loadMapSettings() {
    var cookie = $.cookie('mapSettings');
    var latlng = [50, 20], zoom = 5;
    if (cookie) {
        var a = cookie.split('|');

        latlng = [a[1], a[2]];
        zoom = a[0];
    }
    map.setView(latlng, zoom, false);
}

// Saves current center and zoom to a cookie.
function saveMapSettings() {
    $.cookie('mapSettings', map.getZoom() + '|' + map.getCenter().lat + '|' + map.getCenter().lng);
}

function switchMode(newMode, reset) {
    if (newMode == 'GEOJSON') {
        if (reset) {
            disableMode_GeoJSON();
        }
        disableMode_Summary();
        disableMode_Bboxes();
        disableMode_Changeset();
        enableMode_GeoJSON();
        $('#status_mode').val('GEOJSON');
    } else if (newMode == 'BBOXES') {
        if (reset) {
            disableMode_Bboxes();
        }
        disableMode_GeoJSON();
        disableMode_Summary();
        disableMode_Changeset();
        enableMode_Bboxes();
        $('#status_mode').val('BBOXES');
    } else if (newMode == 'SUMMARY') {
        if (reset) {
            disableMode_Summary();
        }
        disableMode_GeoJSON();
        disableMode_Bboxes();
        disableMode_Changeset();
        enableMode_Summary();
        $('#status_mode').val('SUMMARY');
    } else if (newMode == 'CHANGESET') {
        if (reset) {
            disableMode_Changeset();
        }
        disableMode_GeoJSON();
        disableMode_Bboxes();
        disableMode_Summary();
        enableMode_Changeset();
        $('#status_mode').val('SUMMARY');
    }
    mode = newMode;
}

function updateStatusbar(html) {
    $('#statusbar').html(html);
    $('#reset_settings').on('click', function (e) {
        customSettings = false;
        updateStatusbar(templates.statusbar());
        setModeForZoomLevel();
        return false;
    });
}

function enableCustomSettings() {
    customSettings = true;
    //updateStatusbar($('#statusbar').html() + templates.statusbar_reset_settings());
}

$(function() {
    // Set up templates
    templates = _($('script[name]')).reduce(function(memo, el) {
        memo[el.getAttribute('name')] = _(el.innerHTML).template();
        return memo;
    }, {});

    // Set up map
    map = L.map('map', {
        minZoom: 2,
        maxBounds: [
            [82, 180],
            [-82, -180]
        ]
    });

    loadMapSettings();
    new L.Hash(map);

    // Handle RSS/ATOM feed link updates.
    map.on('moveend', function (e) { saveMapSettings(); updateFeedLink(); });
    map.on('zoomend', function (e) { saveMapSettings(); updateFeedLink(); });

    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    updateStatusbar(templates.statusbar());

    initGeoJSON();
    initSummary();
    initBboxMode();
    initChangesetMode();

    setModeForZoomLevel();
    map.on('zoomend', setModeForZoomLevel);

    updateFeedLink();

    $('#status_mode').on('change', function (e) {
        enableCustomSettings();
        switchMode($(e.target).val(), false);
    });

    $('#status_timelimit').on('change', function (e) {
        switchMode(mode, true);
    });

    // Active state handling.
    $('.nav-container a').click(function() {
        if ($(this).parent().hasClass('active')) {
            $('.nav-container').removeClass('active');
        } else {
            $('.nav-container').removeClass('active');
            $(this).parent().addClass('active');
        }
    });
    $('.nav-container').mousedown(function(event){
        event.stopPropagation();
    });
    $('html').mousedown(function() {
        $('.nav-container').removeClass('active');
    });
    $('.nav-container').bind( "touchstart", function(event){
        event.stopPropagation();
    });
    $('html').bind( "touchstart", function(e){
        $('.nav-container').removeClass('active');
    });

    // Edit links
    $('.edit-osm').click(function(e) {
        var editor = $(e.currentTarget).attr('editor');
        if (editor == 'remote') {
            var sw = map.getBounds().getSouthWest();
            var ne = map.getBounds().getNorthEast();
            $.ajax({
                url: 'http://127.0.0.1:8111/load_and_zoom' +
                    '?left='   + sw.lng +
                    '&right='  + ne.lng +
                    '&top='    + ne.lat +
                    '&bottom=' + sw.lat +
                    '&new_layer=0',
                complete: function(response) {
                    if (response.status != 200) {
                        window.alert('Could not connect to JOSM. Is JOSM running? Is Remote Control enabled?');
                    }
                }
            });
        } else {
            var center = map.getCenter();
            var zoom   = map.getZoom();
            window.location =
                'http://www.openstreetmap.org/edit' +
                '?editor=' + editor +
                '&lat='    + center.lat +
                '&lon='    + center.lng +
                '&zoom='   + zoom;
        }
        return false;
    });
});

// Return a formatted date in local time
// 11:36 AM, Oct 20, 2012
Date.prototype.nice = function() {
    var months = {
        0: 'Jan',
        1: 'Feb',
        2: 'Mar',
        3: 'Apr',
        4: 'May',
        5: 'Jun',
        6: 'Jul',
        7: 'Aug',
        8: 'Sep',
        9: 'Oct',
        10: 'Nov',
        11: 'Dec'
    };
    //var AMPM = 'AM'
    var hours = this.getHours();
    //if (hours > 12) {
    //    hours = hours - 12;
    //    hours = hours == 0 ? 12 : hours;
    //    AMPM = 'PM';
    //}
    var o = '';
    o += this.getDate();
    o += ' ';
    o += months[this.getMonth()];
    o += ' ';
    o += this.getFullYear();
    o += ', ';
    o += hours;
    o += ':';
    o += this.getMinutes() < 10 ? '0' + this.getMinutes() : this.getMinutes();
    return o;
};
