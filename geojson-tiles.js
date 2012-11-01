// Load tiled GeoJSON and merge into single features array.
// Requires jQuery for jsonp.
L.TileLayer.GeoJSON = L.TileLayer.extend({
    data: null,
    _addTile: function(tilePoint, container) {
        this._loadTile(null, tilePoint);
    },
    _loadTile: function (tile, tilePoint) {
        var layer = this;
        $.ajax({
            url: this.getTileUrl(tilePoint),
            dataType: 'jsonp',
            success: function(geojson) {
                if (!layer.data) {
                    layer.data = geojson;
                } else if (geojson.features) {
                    layer.data.features = layer.data.features || [];
                    layer.data.features =
                        layer.data.features.concat(geojson.features);
                }
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
