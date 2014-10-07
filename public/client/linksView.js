Shortly.LinksView = Backbone.View.extend({
  className: 'links',

  initialize: function(){
    this.collection.on('sync', this.addAll, this);
    this.collection.fetch();
  },

  render: function() {
    this.$el.empty();
    return this;
  },

  addAll: function(){
    console.log(this.collection)
    this.collection.forEach(this.addOne, this);
  },

  addOne: function(item){
    console.log(item)
    var view = new Shortly.LinkView({ model: item });
    this.$el.append(view.render().el);
  }
});
