// Load data and track location of tiles.
L.TileLayer.Marker = L.TileLayer.Data.extend({
    _addTile: function(tilePoint, container) {
        var tile = {
            data: null,
            location: this._map.layerPointToLatLng(this._getTilePos(tilePoint).add({x: 125, y: 125}))
        };
        this._tiles[tilePoint.x + ':' + tilePoint.y] = tile;
        this._loadTile(tile, tilePoint);
    }
});
