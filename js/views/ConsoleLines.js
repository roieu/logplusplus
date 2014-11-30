;(function() {

Log.Views.ConsoleLinesClass = Backbone.View.extend({
	el: "#content",

	childView: Log.Views.ConsoleLineClass,

	initialize: function(options) {
		this.dataFeedModel = options.dataFeedModel;
		this.filtersModel = options.filtersModel;

		this.listenTo(this.dataFeedModel, "change:feed", this.clear);
		this.listenTo(this.dataFeedModel, "change:paused", this.onPausedToggled);
		this.listenTo(this.dataFeedModel, "dataAvailable", this.onDataAvailable);
		this.listenTo(this.filtersModel, "change:activeFilters", this.changeActiveFilters);
		this.listenTo(this.collection, "change:hidden", this.onHiddenChange);
		this.listenTo(this.collection, "activeFilterChangedKeys", this.onActiveFilterChangedKeys);
		this.listenTo(this.collection, "deleted", this.delete);
	},

	clear: function() {
		this.collection.reset();
	},

	onPausedToggled: function(model, paused) {
		if (paused) this.stopChunks();
	},

	stopChunks: function() {
		clearTimeout(this.nextChunkTimer);
		this.nextChunkTimer = null;
	},

	onDataAvailable: function(data) {
		var $this = this;
		if (data) {
			_.defer(function() { $this.dataFeedModel.nextChunk(); });
			this.addLines(data);
		} else {
			this.nextChunkTimer = setTimeout(function() { $this.nextChunkTimer = null; $this.dataFeedModel.nextChunk(); }, 250);
		}
	},

	addLines: function(data) {
		function addLine(line) {
			var model = createLineModel(line, prevLine);
			model.applyFilters($this.collection.activeFilterKeys);

			model.__view = createLineView(model);
			$this.el.appendChild(model.__view.el);
			prevLine = line;

			models.push(model);
		}

		var $this = this, scrollIntoView = this.isScrolledToBottom(), newLines = [], prevLine, models = [];
		data.replace(/[^\n]*\n/g, function(line) { addLine(line); });
		$this.collection.add(models);

		this.pruneLines();
		if (scrollIntoView) this.collection.last().__view.scrollIntoView();
	},

	changeActiveFilters: function(model, activeFilterKeys) {
		this.collection.changeActiveFilters(activeFilterKeys);
	},

	onActiveFilterChangedKeys: function(changedKeys) {
		function buildFilterSelector(key) {
			return [0, 1, 2, 3].map(function(i) { return "[filter".concat(i, "=", key, "]"); }).join(",");
		}
		changedKeys.forEach(function(key) { this._applyFilters(Array.prototype.slice.call($(buildFilterSelector(key)), this.el)); }, this);
	},

	_applyFilters: function(lineElems) {
		var activeFilters = this.collection.activeFilterKeys;
		lineElems.forEach(function(lineElem) {
			var lineModel = lineElem.__model;
			if (lineModel.filters.every(function(filter) { return !activeFilters[filter]; })) lineModel.set("hidden", true);
			else lineModel.set("hidden", false);
		});
	},

	pruneLines: function() {
		// todo: listen to line limits changes
	},

	reset: function() {//each console line removes itself
		//while (this.el.firstChild)
		//	this.el.removeChild(this.el.firstChild);
		//lastIndex = 0;
	},

	onHiddenChange: function(model, hidden) {
		if (!model.__view) return;

		if (hidden) {
			model.__view.hide();
		} else {
			model.__view.show();
		}
	},

	delete: function(lineModel) {
		lineModel.__view.el.remove();
	},

	isScrolledToBottom: function() {
		var lastLineModel = this.collection.last();
		if (!lastLineModel  || !lastLineModel.__view) return true;

		var lastLineHeight = lastLineModel.__view.getHeight();
		return this.el.scrollTop + this.el.clientHeight >= this.el.scrollHeight - (lastLineHeight / 2);
	}
});

function createLineModel(line, prevLine) {
	return new Log.Models.ConsoleLineClass({ raw: line, prevLine: line });
}

function createLineView(lineModel) {
	var view = document.createElement("div");
	var hidden = lineModel.get("hidden") ? "hidden" : "";
	view.setAttribute("type", lineModel.type);
	view.setAttribute("severity", lineModel.severity);
	view.setAttribute("class", "logLine ".concat(lineModel.severity, " ", hidden));

	var filters = lineModel.filters, filterLen = filters.length;
	for (var i = 0; i < filterLen; ++i) view.setAttribute("filter" + i, filters[i]);

	view.textContent = lineModel.text;
	view.el = view;
	view.render = function() { return this; };
	view.hide = function() { $(this).addClass("hidden"); };
	view.show = function() { $(this).removeClass("hidden"); };
	view.getHeight = function() { return $(this).height(); };

	view.__model = lineModel;

	return view;
}

})();