
// Oracle Client
// -------
'use strict';

exports.__esModule = true;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _lodash = require('lodash');

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _formatter = require('./formatter');

var _formatter2 = _interopRequireDefault(_formatter);

var _client = require('../../client');

var _client2 = _interopRequireDefault(_client);

var _promise = require('../../promise');

var _promise2 = _interopRequireDefault(_promise);

var _helpers = require('../../helpers');

var helpers = _interopRequireWildcard(_helpers);

var _queryString = require('../../query/string');

var _queryString2 = _interopRequireDefault(_queryString);

var _transaction = require('./transaction');

var _transaction2 = _interopRequireDefault(_transaction);

var _queryCompiler = require('./query/compiler');

var _queryCompiler2 = _interopRequireDefault(_queryCompiler);

var _schemaCompiler = require('./schema/compiler');

var _schemaCompiler2 = _interopRequireDefault(_schemaCompiler);

var _schemaColumnbuilder = require('./schema/columnbuilder');

var _schemaColumnbuilder2 = _interopRequireDefault(_schemaColumnbuilder);

var _schemaColumncompiler = require('./schema/columncompiler');

var _schemaColumncompiler2 = _interopRequireDefault(_schemaColumncompiler);

var _schemaTablecompiler = require('./schema/tablecompiler');

var _schemaTablecompiler2 = _interopRequireDefault(_schemaTablecompiler);

var _stream2 = require('./stream');

var _stream3 = _interopRequireDefault(_stream2);

var _utils = require('./utils');

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
function Client_Oracle(config) {
  _client2['default'].call(this, config);
}
_inherits2['default'](Client_Oracle, _client2['default']);

_lodash.assign(Client_Oracle.prototype, {

  dialect: 'oracle',

  driverName: 'oracle',

  _driver: function _driver() {
    return require('oracle');
  },

  Transaction: _transaction2['default'],

  Formatter: _formatter2['default'],

  QueryCompiler: _queryCompiler2['default'],

  SchemaCompiler: _schemaCompiler2['default'],

  ColumnBuilder: _schemaColumnbuilder2['default'],

  ColumnCompiler: _schemaColumncompiler2['default'],

  TableCompiler: _schemaTablecompiler2['default'],

  prepBindings: function prepBindings(bindings) {
    var _this = this;

    return _lodash.map(bindings, function (value) {
      // returning helper uses always ROWID as string
      if (value instanceof _utils.ReturningHelper && _this.driver) {
        return new _this.driver.OutParam(_this.driver.OCCISTRING);
      } else if (typeof value === 'boolean') {
        return value ? 1 : 0;
      } else if (Buffer.isBuffer(value)) {
        return _queryString2['default'].bufferToString(value);
      }
      return value;
    });
  },

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection: function acquireRawConnection() {
    var client = this;
    return new _promise2['default'](function (resolver, rejecter) {
      client.driver.connect(client.connectionSettings, function (err, connection) {
        if (err) return rejecter(err);
        _promise2['default'].promisifyAll(connection);
        if (client.connectionSettings.prefetchRowCount) {
          connection.setPrefetchRowCount(client.connectionSettings.prefetchRowCount);
        }
        resolver(connection);
      });
    });
  },

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection: function destroyRawConnection(connection, cb) {
    connection.close();
    cb();
  },

  // Return the database for the Oracle client.
  database: function database() {
    return this.connectionSettings.database;
  },

  // Position the bindings for the query.
  positionBindings: function positionBindings(sql) {
    var questionCount = 0;
    return sql.replace(/\?/g, function () {
      questionCount += 1;
      return ':' + questionCount;
    });
  },

  _stream: function _stream(connection, obj, stream, options) {
    obj.sql = this.positionBindings(obj.sql);
    return new _promise2['default'](function (resolver, rejecter) {
      stream.on('error', rejecter);
      stream.on('end', resolver);
      var queryStream = new _stream3['default'](connection, obj.sql, obj.bindings, options);
      queryStream.pipe(stream);
    });
  },

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  _query: function _query(connection, obj) {

    // convert ? params into positional bindings (:1)
    obj.sql = this.positionBindings(obj.sql);

    if (!obj.sql) throw new Error('The query is empty');

    return connection.executeAsync(obj.sql, obj.bindings).then(function (response) {
      if (!obj.returning) return response;
      var rowIds = obj.outParams.map(function (v, i) {
        return response['returnParam' + (i ? i : '')];
      });
      return connection.executeAsync(obj.returningSql, rowIds);
    }).then(function (response) {
      obj.response = response;
      return obj;
    });
  },

  // Process the response as returned from the query.
  processResponse: function processResponse(obj, runner) {
    var response = obj.response;
    var method = obj.method;

    if (obj.output) return obj.output.call(runner, response);
    switch (method) {
      case 'select':
      case 'pluck':
      case 'first':
        response = helpers.skim(response);
        if (obj.method === 'pluck') response = _lodash.map(response, obj.pluck);
        return obj.method === 'first' ? response[0] : response;
      case 'insert':
      case 'del':
      case 'update':
      case 'counter':
        if (obj.returning) {
          if (obj.returning.length > 1 || obj.returning[0] === '*') {
            return response;
          }
          // return an array with values if only one returning value was specified
          return _lodash.flatten(_lodash.map(response, _lodash.values));
        }
        return response.updateCount;
      default:
        return response;
    }
  },

  ping: function ping(resource, callback) {
    resource.execute('SELECT 1 FROM DUAL', [], callback);
  }

});

exports['default'] = Client_Oracle;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9kaWFsZWN0cy9vcmFjbGUvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7c0JBRzZDLFFBQVE7O3dCQUVoQyxVQUFVOzs7O3lCQUNULGFBQWE7Ozs7c0JBQ2hCLGNBQWM7Ozs7dUJBQ2IsZUFBZTs7Ozt1QkFDVixlQUFlOztJQUE1QixPQUFPOzsyQkFDRyxvQkFBb0I7Ozs7MkJBRWxCLGVBQWU7Ozs7NkJBQ2Isa0JBQWtCOzs7OzhCQUNqQixtQkFBbUI7Ozs7bUNBQ3BCLHdCQUF3Qjs7OztvQ0FDdkIseUJBQXlCOzs7O21DQUMxQix3QkFBd0I7Ozs7dUJBQ3BCLFVBQVU7Ozs7cUJBQ1IsU0FBUzs7Ozs7QUFLekMsU0FBUyxhQUFhLENBQUMsTUFBTSxFQUFFO0FBQzdCLHNCQUFPLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUE7Q0FDMUI7QUFDRCxzQkFBUyxhQUFhLHNCQUFTLENBQUE7O0FBRS9CLGVBQU8sYUFBYSxDQUFDLFNBQVMsRUFBRTs7QUFFOUIsU0FBTyxFQUFFLFFBQVE7O0FBRWpCLFlBQVUsRUFBRSxRQUFROztBQUVwQixTQUFPLEVBQUEsbUJBQUc7QUFDUixXQUFPLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQTtHQUN6Qjs7QUFFRCxhQUFXLDBCQUFBOztBQUVYLFdBQVMsd0JBQUE7O0FBRVQsZUFBYSw0QkFBQTs7QUFFYixnQkFBYyw2QkFBQTs7QUFFZCxlQUFhLGtDQUFBOztBQUViLGdCQUFjLG1DQUFBOztBQUVkLGVBQWEsa0NBQUE7O0FBRWIsY0FBWSxFQUFBLHNCQUFDLFFBQVEsRUFBRTs7O0FBQ3JCLFdBQU8sWUFBSSxRQUFRLEVBQUUsVUFBQyxLQUFLLEVBQUs7O0FBRTlCLFVBQUksS0FBSyxrQ0FBMkIsSUFBSSxNQUFLLE1BQU0sRUFBRTtBQUNuRCxlQUFPLElBQUksTUFBSyxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQUssTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFBO09BQ3hELE1BQ0ksSUFBSSxPQUFPLEtBQUssS0FBSyxTQUFTLEVBQUU7QUFDbkMsZUFBTyxLQUFLLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQTtPQUNyQixNQUNJLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUMvQixlQUFPLHlCQUFVLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQTtPQUN2QztBQUNELGFBQU8sS0FBSyxDQUFBO0tBQ2IsQ0FBQyxDQUFBO0dBQ0g7Ozs7QUFJRCxzQkFBb0IsRUFBQSxnQ0FBRztBQUNyQixRQUFNLE1BQU0sR0FBRyxJQUFJLENBQUE7QUFDbkIsV0FBTyx5QkFBWSxVQUFTLFFBQVEsRUFBRSxRQUFRLEVBQUU7QUFDOUMsWUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLGtCQUFrQixFQUM3QyxVQUFTLEdBQUcsRUFBRSxVQUFVLEVBQUU7QUFDeEIsWUFBSSxHQUFHLEVBQUUsT0FBTyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUE7QUFDN0IsNkJBQVEsWUFBWSxDQUFDLFVBQVUsQ0FBQyxDQUFBO0FBQ2hDLFlBQUksTUFBTSxDQUFDLGtCQUFrQixDQUFDLGdCQUFnQixFQUFFO0FBQzlDLG9CQUFVLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLGtCQUFrQixDQUFDLGdCQUFnQixDQUFDLENBQUE7U0FDM0U7QUFDRCxnQkFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFBO09BQ3JCLENBQUMsQ0FBQTtLQUNMLENBQUMsQ0FBQTtHQUNIOzs7O0FBSUQsc0JBQW9CLEVBQUEsOEJBQUMsVUFBVSxFQUFFLEVBQUUsRUFBRTtBQUNuQyxjQUFVLENBQUMsS0FBSyxFQUFFLENBQUE7QUFDbEIsTUFBRSxFQUFFLENBQUE7R0FDTDs7O0FBR0QsVUFBUSxFQUFBLG9CQUFHO0FBQ1QsV0FBTyxJQUFJLENBQUMsa0JBQWtCLENBQUMsUUFBUSxDQUFBO0dBQ3hDOzs7QUFHRCxrQkFBZ0IsRUFBQSwwQkFBQyxHQUFHLEVBQUU7QUFDcEIsUUFBSSxhQUFhLEdBQUcsQ0FBQyxDQUFBO0FBQ3JCLFdBQU8sR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsWUFBVztBQUNuQyxtQkFBYSxJQUFJLENBQUMsQ0FBQTtBQUNsQixtQkFBVyxhQUFhLENBQUU7S0FDM0IsQ0FBQyxDQUFBO0dBQ0g7O0FBRUQsU0FBTyxFQUFBLGlCQUFDLFVBQVUsRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRTtBQUN4QyxPQUFHLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDekMsV0FBTyx5QkFBWSxVQUFVLFFBQVEsRUFBRSxRQUFRLEVBQUU7QUFDL0MsWUFBTSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDN0IsWUFBTSxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDM0IsVUFBTSxXQUFXLEdBQUcsd0JBQXNCLFVBQVUsRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDdEYsaUJBQVcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7S0FDekIsQ0FBQyxDQUFDO0dBQ0o7Ozs7QUFJRCxRQUFNLEVBQUEsZ0JBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRTs7O0FBR3RCLE9BQUcsQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQzs7QUFFekMsUUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDOztBQUVwRCxXQUFPLFVBQVUsQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVMsUUFBUSxFQUFFO0FBQzVFLFVBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLE9BQU8sUUFBUSxDQUFBO0FBQ25DLFVBQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFVBQUMsQ0FBQyxFQUFFLENBQUM7ZUFBSyxRQUFRLGtCQUFlLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFBLENBQUc7T0FBQSxDQUFDLENBQUM7QUFDakYsYUFBTyxVQUFVLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsTUFBTSxDQUFDLENBQUE7S0FDekQsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFTLFFBQVEsRUFBRTtBQUN6QixTQUFHLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztBQUN4QixhQUFPLEdBQUcsQ0FBQTtLQUNYLENBQUMsQ0FBQTtHQUVIOzs7QUFHRCxpQkFBZSxFQUFBLHlCQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUU7UUFDckIsUUFBUSxHQUFLLEdBQUcsQ0FBaEIsUUFBUTtRQUNOLE1BQU0sR0FBSyxHQUFHLENBQWQsTUFBTTs7QUFDZCxRQUFJLEdBQUcsQ0FBQyxNQUFNLEVBQUUsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDekQsWUFBUSxNQUFNO0FBQ1osV0FBSyxRQUFRLENBQUM7QUFDZCxXQUFLLE9BQU8sQ0FBQztBQUNiLFdBQUssT0FBTztBQUNWLGdCQUFRLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNsQyxZQUFJLEdBQUcsQ0FBQyxNQUFNLEtBQUssT0FBTyxFQUFFLFFBQVEsR0FBRyxZQUFJLFFBQVEsRUFBRSxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDaEUsZUFBTyxHQUFHLENBQUMsTUFBTSxLQUFLLE9BQU8sR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDO0FBQUEsQUFDekQsV0FBSyxRQUFRLENBQUM7QUFDZCxXQUFLLEtBQUssQ0FBQztBQUNYLFdBQUssUUFBUSxDQUFDO0FBQ2QsV0FBSyxTQUFTO0FBQ1osWUFBSSxHQUFHLENBQUMsU0FBUyxFQUFFO0FBQ2pCLGNBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFO0FBQ3hELG1CQUFPLFFBQVEsQ0FBQztXQUNqQjs7QUFFRCxpQkFBTyxnQkFBUSxZQUFJLFFBQVEsaUJBQVMsQ0FBQyxDQUFDO1NBQ3ZDO0FBQ0QsZUFBTyxRQUFRLENBQUMsV0FBVyxDQUFDO0FBQUEsQUFDOUI7QUFDRSxlQUFPLFFBQVEsQ0FBQztBQUFBLEtBQ25CO0dBQ0Y7O0FBRUQsTUFBSSxFQUFBLGNBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRTtBQUN2QixZQUFRLENBQUMsT0FBTyxDQUFDLG9CQUFvQixFQUFFLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQztHQUN0RDs7Q0FFRixDQUFDLENBQUE7O3FCQUVhLGFBQWEiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJcbi8vIE9yYWNsZSBDbGllbnRcbi8vIC0tLS0tLS1cbmltcG9ydCB7IGFzc2lnbiwgbWFwLCBmbGF0dGVuLCB2YWx1ZXMgfSBmcm9tICdsb2Rhc2gnXG5cbmltcG9ydCBpbmhlcml0cyBmcm9tICdpbmhlcml0cyc7XG5pbXBvcnQgRm9ybWF0dGVyIGZyb20gJy4vZm9ybWF0dGVyJztcbmltcG9ydCBDbGllbnQgZnJvbSAnLi4vLi4vY2xpZW50JztcbmltcG9ydCBQcm9taXNlIGZyb20gJy4uLy4uL3Byb21pc2UnO1xuaW1wb3J0ICogYXMgaGVscGVycyBmcm9tICcuLi8uLi9oZWxwZXJzJztcbmltcG9ydCBTcWxTdHJpbmcgZnJvbSAnLi4vLi4vcXVlcnkvc3RyaW5nJztcblxuaW1wb3J0IFRyYW5zYWN0aW9uIGZyb20gJy4vdHJhbnNhY3Rpb24nO1xuaW1wb3J0IFF1ZXJ5Q29tcGlsZXIgZnJvbSAnLi9xdWVyeS9jb21waWxlcic7XG5pbXBvcnQgU2NoZW1hQ29tcGlsZXIgZnJvbSAnLi9zY2hlbWEvY29tcGlsZXInO1xuaW1wb3J0IENvbHVtbkJ1aWxkZXIgZnJvbSAnLi9zY2hlbWEvY29sdW1uYnVpbGRlcic7XG5pbXBvcnQgQ29sdW1uQ29tcGlsZXIgZnJvbSAnLi9zY2hlbWEvY29sdW1uY29tcGlsZXInO1xuaW1wb3J0IFRhYmxlQ29tcGlsZXIgZnJvbSAnLi9zY2hlbWEvdGFibGVjb21waWxlcic7XG5pbXBvcnQgT3JhY2xlUXVlcnlTdHJlYW0gZnJvbSAnLi9zdHJlYW0nO1xuaW1wb3J0IHsgUmV0dXJuaW5nSGVscGVyIH0gZnJvbSAnLi91dGlscyc7XG5cbi8vIEFsd2F5cyBpbml0aWFsaXplIHdpdGggdGhlIFwiUXVlcnlCdWlsZGVyXCIgYW5kIFwiUXVlcnlDb21waWxlclwiXG4vLyBvYmplY3RzLCB3aGljaCBleHRlbmQgdGhlIGJhc2UgJ2xpYi9xdWVyeS9idWlsZGVyJyBhbmRcbi8vICdsaWIvcXVlcnkvY29tcGlsZXInLCByZXNwZWN0aXZlbHkuXG5mdW5jdGlvbiBDbGllbnRfT3JhY2xlKGNvbmZpZykge1xuICBDbGllbnQuY2FsbCh0aGlzLCBjb25maWcpXG59XG5pbmhlcml0cyhDbGllbnRfT3JhY2xlLCBDbGllbnQpXG5cbmFzc2lnbihDbGllbnRfT3JhY2xlLnByb3RvdHlwZSwge1xuXG4gIGRpYWxlY3Q6ICdvcmFjbGUnLFxuXG4gIGRyaXZlck5hbWU6ICdvcmFjbGUnLFxuXG4gIF9kcml2ZXIoKSB7XG4gICAgcmV0dXJuIHJlcXVpcmUoJ29yYWNsZScpXG4gIH0sXG5cbiAgVHJhbnNhY3Rpb24sXG5cbiAgRm9ybWF0dGVyLFxuXG4gIFF1ZXJ5Q29tcGlsZXIsXG5cbiAgU2NoZW1hQ29tcGlsZXIsXG5cbiAgQ29sdW1uQnVpbGRlcixcblxuICBDb2x1bW5Db21waWxlcixcblxuICBUYWJsZUNvbXBpbGVyLFxuXG4gIHByZXBCaW5kaW5ncyhiaW5kaW5ncykge1xuICAgIHJldHVybiBtYXAoYmluZGluZ3MsICh2YWx1ZSkgPT4ge1xuICAgICAgLy8gcmV0dXJuaW5nIGhlbHBlciB1c2VzIGFsd2F5cyBST1dJRCBhcyBzdHJpbmdcbiAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIFJldHVybmluZ0hlbHBlciAmJiB0aGlzLmRyaXZlcikge1xuICAgICAgICByZXR1cm4gbmV3IHRoaXMuZHJpdmVyLk91dFBhcmFtKHRoaXMuZHJpdmVyLk9DQ0lTVFJJTkcpXG4gICAgICB9XG4gICAgICBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09ICdib29sZWFuJykge1xuICAgICAgICByZXR1cm4gdmFsdWUgPyAxIDogMFxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoQnVmZmVyLmlzQnVmZmVyKHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gU3FsU3RyaW5nLmJ1ZmZlclRvU3RyaW5nKHZhbHVlKVxuICAgICAgfVxuICAgICAgcmV0dXJuIHZhbHVlXG4gICAgfSlcbiAgfSxcblxuICAvLyBHZXQgYSByYXcgY29ubmVjdGlvbiwgY2FsbGVkIGJ5IHRoZSBgcG9vbGAgd2hlbmV2ZXIgYSBuZXdcbiAgLy8gY29ubmVjdGlvbiBuZWVkcyB0byBiZSBhZGRlZCB0byB0aGUgcG9vbC5cbiAgYWNxdWlyZVJhd0Nvbm5lY3Rpb24oKSB7XG4gICAgY29uc3QgY2xpZW50ID0gdGhpc1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlciwgcmVqZWN0ZXIpIHtcbiAgICAgIGNsaWVudC5kcml2ZXIuY29ubmVjdChjbGllbnQuY29ubmVjdGlvblNldHRpbmdzLFxuICAgICAgICBmdW5jdGlvbihlcnIsIGNvbm5lY3Rpb24pIHtcbiAgICAgICAgICBpZiAoZXJyKSByZXR1cm4gcmVqZWN0ZXIoZXJyKVxuICAgICAgICAgIFByb21pc2UucHJvbWlzaWZ5QWxsKGNvbm5lY3Rpb24pXG4gICAgICAgICAgaWYgKGNsaWVudC5jb25uZWN0aW9uU2V0dGluZ3MucHJlZmV0Y2hSb3dDb3VudCkge1xuICAgICAgICAgICAgY29ubmVjdGlvbi5zZXRQcmVmZXRjaFJvd0NvdW50KGNsaWVudC5jb25uZWN0aW9uU2V0dGluZ3MucHJlZmV0Y2hSb3dDb3VudClcbiAgICAgICAgICB9XG4gICAgICAgICAgcmVzb2x2ZXIoY29ubmVjdGlvbilcbiAgICAgICAgfSlcbiAgICB9KVxuICB9LFxuXG4gIC8vIFVzZWQgdG8gZXhwbGljaXRseSBjbG9zZSBhIGNvbm5lY3Rpb24sIGNhbGxlZCBpbnRlcm5hbGx5IGJ5IHRoZSBwb29sXG4gIC8vIHdoZW4gYSBjb25uZWN0aW9uIHRpbWVzIG91dCBvciB0aGUgcG9vbCBpcyBzaHV0ZG93bi5cbiAgZGVzdHJveVJhd0Nvbm5lY3Rpb24oY29ubmVjdGlvbiwgY2IpIHtcbiAgICBjb25uZWN0aW9uLmNsb3NlKClcbiAgICBjYigpXG4gIH0sXG5cbiAgLy8gUmV0dXJuIHRoZSBkYXRhYmFzZSBmb3IgdGhlIE9yYWNsZSBjbGllbnQuXG4gIGRhdGFiYXNlKCkge1xuICAgIHJldHVybiB0aGlzLmNvbm5lY3Rpb25TZXR0aW5ncy5kYXRhYmFzZVxuICB9LFxuXG4gIC8vIFBvc2l0aW9uIHRoZSBiaW5kaW5ncyBmb3IgdGhlIHF1ZXJ5LlxuICBwb3NpdGlvbkJpbmRpbmdzKHNxbCkge1xuICAgIGxldCBxdWVzdGlvbkNvdW50ID0gMFxuICAgIHJldHVybiBzcWwucmVwbGFjZSgvXFw/L2csIGZ1bmN0aW9uKCkge1xuICAgICAgcXVlc3Rpb25Db3VudCArPSAxXG4gICAgICByZXR1cm4gYDoke3F1ZXN0aW9uQ291bnR9YFxuICAgIH0pXG4gIH0sXG5cbiAgX3N0cmVhbShjb25uZWN0aW9uLCBvYmosIHN0cmVhbSwgb3B0aW9ucykge1xuICAgIG9iai5zcWwgPSB0aGlzLnBvc2l0aW9uQmluZGluZ3Mob2JqLnNxbCk7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlciwgcmVqZWN0ZXIpIHtcbiAgICAgIHN0cmVhbS5vbignZXJyb3InLCByZWplY3Rlcik7XG4gICAgICBzdHJlYW0ub24oJ2VuZCcsIHJlc29sdmVyKTtcbiAgICAgIGNvbnN0IHF1ZXJ5U3RyZWFtID0gbmV3IE9yYWNsZVF1ZXJ5U3RyZWFtKGNvbm5lY3Rpb24sIG9iai5zcWwsIG9iai5iaW5kaW5ncywgb3B0aW9ucyk7XG4gICAgICBxdWVyeVN0cmVhbS5waXBlKHN0cmVhbSlcbiAgICB9KTtcbiAgfSxcblxuICAvLyBSdW5zIHRoZSBxdWVyeSBvbiB0aGUgc3BlY2lmaWVkIGNvbm5lY3Rpb24sIHByb3ZpZGluZyB0aGUgYmluZGluZ3NcbiAgLy8gYW5kIGFueSBvdGhlciBuZWNlc3NhcnkgcHJlcCB3b3JrLlxuICBfcXVlcnkoY29ubmVjdGlvbiwgb2JqKSB7XG5cbiAgICAvLyBjb252ZXJ0ID8gcGFyYW1zIGludG8gcG9zaXRpb25hbCBiaW5kaW5ncyAoOjEpXG4gICAgb2JqLnNxbCA9IHRoaXMucG9zaXRpb25CaW5kaW5ncyhvYmouc3FsKTtcblxuICAgIGlmICghb2JqLnNxbCkgdGhyb3cgbmV3IEVycm9yKCdUaGUgcXVlcnkgaXMgZW1wdHknKTtcblxuICAgIHJldHVybiBjb25uZWN0aW9uLmV4ZWN1dGVBc3luYyhvYmouc3FsLCBvYmouYmluZGluZ3MpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgIGlmICghb2JqLnJldHVybmluZykgcmV0dXJuIHJlc3BvbnNlXG4gICAgICBjb25zdCByb3dJZHMgPSBvYmoub3V0UGFyYW1zLm1hcCgodiwgaSkgPT4gcmVzcG9uc2VbYHJldHVyblBhcmFtJHtpID8gaSA6ICcnfWBdKTtcbiAgICAgIHJldHVybiBjb25uZWN0aW9uLmV4ZWN1dGVBc3luYyhvYmoucmV0dXJuaW5nU3FsLCByb3dJZHMpXG4gICAgfSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgb2JqLnJlc3BvbnNlID0gcmVzcG9uc2U7XG4gICAgICByZXR1cm4gb2JqXG4gICAgfSlcblxuICB9LFxuXG4gIC8vIFByb2Nlc3MgdGhlIHJlc3BvbnNlIGFzIHJldHVybmVkIGZyb20gdGhlIHF1ZXJ5LlxuICBwcm9jZXNzUmVzcG9uc2Uob2JqLCBydW5uZXIpIHtcbiAgICBsZXQgeyByZXNwb25zZSB9ID0gb2JqO1xuICAgIGNvbnN0IHsgbWV0aG9kIH0gPSBvYmo7XG4gICAgaWYgKG9iai5vdXRwdXQpIHJldHVybiBvYmoub3V0cHV0LmNhbGwocnVubmVyLCByZXNwb25zZSk7XG4gICAgc3dpdGNoIChtZXRob2QpIHtcbiAgICAgIGNhc2UgJ3NlbGVjdCc6XG4gICAgICBjYXNlICdwbHVjayc6XG4gICAgICBjYXNlICdmaXJzdCc6XG4gICAgICAgIHJlc3BvbnNlID0gaGVscGVycy5za2ltKHJlc3BvbnNlKTtcbiAgICAgICAgaWYgKG9iai5tZXRob2QgPT09ICdwbHVjaycpIHJlc3BvbnNlID0gbWFwKHJlc3BvbnNlLCBvYmoucGx1Y2spO1xuICAgICAgICByZXR1cm4gb2JqLm1ldGhvZCA9PT0gJ2ZpcnN0JyA/IHJlc3BvbnNlWzBdIDogcmVzcG9uc2U7XG4gICAgICBjYXNlICdpbnNlcnQnOlxuICAgICAgY2FzZSAnZGVsJzpcbiAgICAgIGNhc2UgJ3VwZGF0ZSc6XG4gICAgICBjYXNlICdjb3VudGVyJzpcbiAgICAgICAgaWYgKG9iai5yZXR1cm5pbmcpIHtcbiAgICAgICAgICBpZiAob2JqLnJldHVybmluZy5sZW5ndGggPiAxIHx8IG9iai5yZXR1cm5pbmdbMF0gPT09ICcqJykge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyByZXR1cm4gYW4gYXJyYXkgd2l0aCB2YWx1ZXMgaWYgb25seSBvbmUgcmV0dXJuaW5nIHZhbHVlIHdhcyBzcGVjaWZpZWRcbiAgICAgICAgICByZXR1cm4gZmxhdHRlbihtYXAocmVzcG9uc2UsIHZhbHVlcykpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXNwb25zZS51cGRhdGVDb3VudDtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9XG4gIH0sXG5cbiAgcGluZyhyZXNvdXJjZSwgY2FsbGJhY2spIHtcbiAgICByZXNvdXJjZS5leGVjdXRlKCdTRUxFQ1QgMSBGUk9NIERVQUwnLCBbXSwgY2FsbGJhY2spO1xuICB9XG5cbn0pXG5cbmV4cG9ydCBkZWZhdWx0IENsaWVudF9PcmFjbGVcbiJdfQ==