;(function() {

window.ConsoleLineModel = function(line, prevLine) {
	this.text = line;
	this._favorite = false;
	LineParsers.parse(this);

	if (!LineTypes[this.type]) {
		var lastLineModel = prevLine;
		this.type = (lastLineModel && lastLineModel.type) || "default";
		this.severity = this.severity || (lastLineModel && lastLineModel.severity) || "info";
	}
};

window.ConsoleLineModel.prototype = {
	applyFilters: function(activeFilters) {
		var modelFilters = this.filters = LineFilters.getFilterKeys(this), modelFiltersLen = modelFilters.length;
		var visibleModel;

		for (var i = 0; !visibleModel && i < modelFiltersLen; ++i) {
			if (activeFilters[modelFilters[i]]) {
				visibleModel = true;
			}
		}

		this.hidden = !visibleModel;
	},

	set hidden(val) {
		if (this._hidden != !!val) {
			this._hidden = !!val;
			if (this.__view) this.__view.onHiddenChange(this._hidden);
		}
	},

	get hidden() {
		return this._hidden;
	},

	set favorite(val) {
		if (this._favorite != !!val) {
			this._favorite = !!val;
			this.__view.onFavoriteChange(this._favorite);
		}
	},

	get favorite() {
		return !!this._favorite;
	}
};

})();
