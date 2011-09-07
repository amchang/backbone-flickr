AC.View.Search = Backbone.View.extend({
	tagName: 'form',
	id: 'search',
	events: {
		"submit": "search"
	},
	initialize: function(config) {
		this.render();
	},
	search: function(e){
		var opts = this.collection.ajaxOptions;
		opts.data.text = $(this.el).val();
		opts.data.page = 1;
		this.collection.fetch(opts);
		e.preventDefault();
	},
	render: function(){
		$(this.el).html(this.template);
	},
	template: '\
		<input type="text" title="Search" />\
		<button type="submit">Search</button>\
	' 
});

