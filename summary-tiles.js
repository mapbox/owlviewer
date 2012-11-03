// Load tiled JSON summary and display markers.
// Requires jQuery for jsonp.
L.TileLayer.OWLSummaryTiles = L.TileLayer.extend({

    initialize: function (url, options) {
        this._url = url;
        this._markers = L.layerGroup();
        L.Util.setOptions(this, options);
    },

    onAdd: function (map) {
        L.TileLayer.prototype.onAdd.call(this, map);
        this._markers.addTo(map);
    },

    data: null,

    _addTile: function(tilePoint, container) {
        if (this._getZoomForUrl() > 10) {
            return;
        }
        this._loadTile(null, tilePoint);
    },

    _loadTile: function (tile, tilePoint) {
        var layer = this;
        $.ajax({
            url: this.getTileUrl(tilePoint),
            dataType: 'jsonp',
            success: function(json) {
                var point = layer._map.layerPointToLatLng(layer._getTilePos(tilePoint));
                var summaryIcon = L.divIcon({html: '<h3>' + json.num_changesets + '</h3>'});
                layer._markers.addLayer(L.marker(point, {icon: summaryIcon}));
                layer._tileLoaded();
            },
            error: function() {
                layer._tileLoaded();
            }
        });
    },

    _resetCallback: function() {
        this.data = null;
        L.TileLayer.prototype._resetCallback.apply(this, arguments);
    },

    _update: function() {
        this.data = null;
        L.TileLayer.prototype._update.apply(this, arguments);
    }
});
