// Load tiled data and merge into single array.
// Requires jQuery for jsonp.
L.TileLayer.Data = L.TileLayer.extend({
    _requests: [],
    _data: [],
    // Retrieve data.
    data: function() {
        // Aggregate data on demand as tiles might be reused as map pans.
        if (this._data.length) return this._data;
        for (k in this._tiles) {
            this._tiles[k].data && this._data.push(this._tiles[k].data);
        }
        return this._data;
    },
    _addTile: function(tilePoint, container) {
        var tile = { data: null };
        this._tiles[tilePoint.x + ':' + tilePoint.y] = tile;
        this._loadTile(tile, tilePoint);
    },
    _loadTile: function (tile, tilePoint) {
        var layer = this;
        this._requests.push($.ajax({
            url: this.getTileUrl(tilePoint),
            dataType: 'jsonp',
            success: function(data) {
                tile.data = data;
                layer._data = [];
                layer._tileLoaded();
            },
            error: function() {
                layer._tileLoaded();
            }
        }));
    },
    _resetCallback: function() {
        this._data = [];
        L.TileLayer.prototype._resetCallback.apply(this, arguments);
        for (i in this._requests) {
            this._requests[i].abort();
        }
        this._requests = [];
    },
    _update: function() {
        if (this._map._panTransition && this._map._panTransition._inProgress) { return; }
        L.TileLayer.prototype._update.apply(this, arguments);
    }
});
