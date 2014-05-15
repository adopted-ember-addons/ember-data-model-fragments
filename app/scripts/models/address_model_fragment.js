App.Address = DS.ModelFragment.extend({
  streets : DS.hasManyFragments('street'),
  city    : DS.attr('string'),
  region  : DS.attr('string'),
  country : DS.attr('string')
});
