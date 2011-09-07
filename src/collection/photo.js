AC.Collection.Photo = Backbone.Collection.extend({
	model: AC.Model.Photo,
	initialize: function() {
		// every collection has a custom set of ajaxOptions, don't share
	},
	ajaxOptions: {
		url: 'http://api.flickr.com/services/rest/',
		dataType: 'jsonp',
		data: {
			api_key:'9e472a1785802bf94e41e06931c64c00',
			format:'json',
			text:'',
			page:1,
			per_page:30,
			method:'flickr.photos.search'
		},
		jsonp: 'jsoncallback'
	}
});
