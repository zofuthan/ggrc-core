/*!
 Copyright (C) 2016 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

(function (can, $) {
  'use strict';

  GGRC.Components('snapshotLoader', {
    tag: 'snapshot-loader',
    template: can.view(
      GGRC.mustache_path +
      '/components/snapshot-loader/snapshot-loader.mustache'
    ),
    scope: {
      paging: {
        current: 1,
        pageSize: 5,
        pageSizeSelect: [5, 10, 15]
      },
      mapper: null,
      isLoading: false,
      items: [],
      baseInstance: null,
      scopeId: '@',
      scopeType: '@',
      term: '',
      selected: [],
      updatePaging: function (total) {
        var count = Math.ceil(total / this.attr('paging.pageSize'));
        this.attr('paging.total', total);
        this.attr('paging.count', count);
      },
      setItems: function () {
        // Clean up selection before any items update
        this.unselectAll();
        this.attr('items').replace(this.load());
      },
      onSearch: function () {
        this.setItems();
      },
      prepareRelevantFilters: function () {
        var filters;
        var relevantList = this.attr('mapper.relevant');

        filters = relevantList.attr()
          .map(function (relevant) {
            if (!relevant.value || !relevant.filter) {
              return undefined;
            }
            return {
              type: relevant.filter.type,
              id: Number(relevant.filter.id)
            };
          }).filter(function (item) {
            return item;
          });
        // Filter by scope
        if (this.attr('mapper.useSnapshots') &&
          Number(this.attr('scopeId'))) {
          filters.push({
            type: this.attr('scopeType'),
            id: Number(this.attr('scopeId'))
          });
        }
        return filters;
      },
      prepareBaseQuery: function (modelName, filters, ownedFilter) {
        return GGRC.Utils.QueryAPI
          .buildParam(modelName, {
            filter: this.attr('term'),
            current: this.attr('paging.current'),
            pageSize: this.attr('paging.pageSize')
          }, filters, [], ownedFilter);
      },
      prepareRelatedQuery: function (modelName, ownedFilter) {
        return GGRC.Utils.QueryAPI
          .buildRelevantIdsQuery(modelName, {
            filter: this.attr('term')
          }, {
            type: this.attr('baseInstance.type'),
            id: this.attr('baseInstance.id')
          }, [], ownedFilter);
      },
      prepareOwnedFilter: function () {
        var contact = this.attr('contact');
        var contactEmail = this.attr('mapper.contactEmail');
        var operation = 'owned';
        // This property is set to false till filters are not working properly
        var filterIsWorkingProperly = false;

        if (!contact || !contactEmail || !filterIsWorkingProperly) {
          return null;
        }

        return {
          expression: {
            op: {name: operation},
            ids: [String(contact.id)],
            object_name: this.attr('type')
          }
        };
      },
      getQuery: function () {
        var modelName = this.attr('type');
        var filters = this.prepareRelevantFilters();
        var ownedFilter = this.prepareOwnedFilter();
        var query = this.prepareBaseQuery(modelName, filters, ownedFilter);
        var relatedQuery = this.prepareRelatedQuery(modelName, ownedFilter);
        // Transform Base Query to Snapshot
        query = GGRC.Utils.Snapshots.transformQuery(query);
        // Add Permission check
        query.permissions = 'update';
        // Transform Related Query to Snapshot
        relatedQuery = GGRC.Utils.Snapshots.transformQuery(relatedQuery);
        return {data: [query, relatedQuery]};
      },
      load: function () {
        var dfd = can.Deferred();
        var query = this.getQuery();
        this.attr('isLoading', true);
        GGRC.Utils.QueryAPI
          .makeRequest(query)
          .done(function (responseArr) {
            var data = responseArr[0];
            var filters = responseArr[1].Snapshot.ids;
            var values = data.Snapshot.values;
            var result = values.map(function (item) {
              item = GGRC.Utils.Snapshots.toObject(item);
              item.attr('instance', item);
              return item;
            });
            // Do not perform extra mapping validation in case Assessment generation
            if (!this.attr('mapper.assessmentGenerator')) {
              result.forEach(function (item) {
                item.attr('instance.isMapped',
                  filters.indexOf(item.attr('id')) > -1);
              });
            }
            // Update paging object
            this.updatePaging(data.Snapshot.total);
            dfd.resolve(result);
          }.bind(this))
          .fail(function () {
            dfd.resolve([]);
          })
          .always(function () {
            this.attr('isLoading', false);
          }.bind(this));
        return dfd;
      },
      unselectAll: function () {
        this.attr('items')
          .forEach(function (item) {
            if (!item.attr('isMapped')) {
              item.attr('isSelected', false);
            }
          });
      },
      selectAll: function () {
        this.attr('items').forEach(function (item) {
          if (!item.attr('isMapped')) {
            item.attr('isSelected', true);
          }
        });
      }
    },
    events: {
      '{scope.paging} current': function () {
        this.scope.setItems();
      },
      '{scope.paging} pageSize': function () {
        this.scope.setItems();
      }
    }
  });
})(window.can, window.can.$);
