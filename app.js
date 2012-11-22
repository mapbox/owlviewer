var mode;
var map;
var changesets = [];
var templates;

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
    $('.changeset').on('hover', function(e) {
        if (e.target.id.length == 0) {
            // Not a changeset list element!?
            return;
        }
        var changeset_id = e.target.id.split('-')[1];
        //var details_el = $(e.target).children('div[class=stats]');
        //e.type == "mouseenter" ? details_el.show() : details_el.hide();
        // Now highlight all features for that changeset.
        geoJSONLayer.eachLayer(function(layer) {
              if ((typeof layer.setStyle == 'undefined') || layer.feature.id.indexOf(changeset_id) != 0) {
                  // Not what we're looking for.
                  return;
              }
              if (e.type == "mouseenter") {
                  layer.setStyle({
                      "color": "blue",
                      "opacity": 0.05,
                      "fillOpacity": 0.05
                  });
              } else {
                  layer.setStyle(geoJSONStyle);
              }
        });
    });
}

function highlightChangeset(id) {
    $('#changeset-' + id).addClass('highlight');
}

function unhighlightChangeset(id) {
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
        enableMode_GeoJSON();
        disableMode_Summary();
        disableMode_Bboxes();
        $('#status_mode').val('GEOJSON');
    } else if (newMode == 'BBOXES') {
        if (reset) {
            disableMode_Bboxes();
        }
        enableMode_Bboxes();
        disableMode_GeoJSON();
        disableMode_Summary();
        $('#status_mode').val('BBOXES');
    } else if (newMode == 'SUMMARY') {
        if (reset) {
            disableMode_Summary();
        }
        enableMode_Summary();
        disableMode_GeoJSON();
        disableMode_Bboxes();
        $('#status_mode').val('SUMMARY');
    }
    mode = newMode;
}

function updateStatusbar() {
    $('#statusbar').html(templates.statusbar([]));
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
    map.on('moveend', function (e) { saveMapSettings(); updateFeedLink(); resetChangesetList(); });
    map.on('zoomend', function (e) { saveMapSettings(); updateFeedLink(); resetChangesetList(); });

    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    updateStatusbar();

    initGeoJSON();
    initSummary();
    initBboxMode();

    // Zoom level handling.
    var layerSwitcher = function() {
        if (map.getZoom() >= 16) {
            switchMode('GEOJSON', false);
        } else if (map.getZoom() >= 10) {
            switchMode('BBOXES', false);
        } else {
            switchMode('SUMMARY', false);
        }
    };
    layerSwitcher();
    map.on('zoomend', layerSwitcher);

    updateFeedLink();

    $('#status_mode').on('change', function (e) {
        switchMode($(e.target).val(), false);
    });

    $('#status_timelimit').on('change', function (e) {
        console.log(getTimelimit());
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
