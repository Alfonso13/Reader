//Author: Alfonso Piedrasanta
(function (){
	var Takalik=this.Takalik={};
	var _ObjectProto = Object.prototype.toString;

	var addEvent = function addEvent(element, event, callback){
		if( window.addEventListener ) {
			element.addEventListener(event, callback, false);
		}
		else if( window.attachEvent ) {
			element.attachEvent('on'+event, callback);
		}
		else {
			element['on'+event] = callback;
		}
	};

	Takalik.utils={
		isObject:function isObject(object){
			if(_ObjectProto.call(object) === "[object Object]") return true;
			return false;
		},
		isArray:function isArray(array){
			if(_ObjectProto.call(array) === "[object Array]") return true;
			return false;
		},
		isDefined:function isDefined(el){
			if(arguments.length == 1){
				if(el == undefined) return false;
				return true;
			}
			return console.error("UNDEFINED");
		},
		isString: function isString(str){
			if(_ObjectProto.call(str) === "[object String]") return true;
			return false;
		},
		each:function each(el,callback,context){
			if( Takalik.utils.isDefined(el) ){
				for(var i in el){
					if(context) callback.call(context,el[i],i);
					else callback(el[i],i);
				}
				return;
			}
			return console.error("undefined value")
		},
		getElement: function getElement(element){
			if(element) {
				if( Takalik.utils.isString(element)){
					var prefix = element.substring(0,1);
					var name_element = element.substr(1);
					var node_element;
					switch(prefix) {
						case ".": 
							node_element = document.getElementsByClassName(name_element);
							if(node_element) {
								if(node_element.length == 1) {
									node_element = node_element[0];
								}
							}
							break;
						case "#": 
							node_element = document.getElementById(name_element);
							break;
						default:
							var el = document.querySelectorAll(element);
							if(el) {
								if(el.length == 1){ 
									node_element = el[0]; 
								}
								else {
									node_element = el;
								}
							}
							break;
					}
					if(node_element) {
						return node_element;
					}
					return element + " not exists in document";
				}
			}
			return "UNDEFINED";
		},
		listener: function listener(element, events){
			if(Takalik.utils.isString(element)) {
				var element = Takalik.utils.getElement(element);
				if( "string" != typeof element) {
					if( Takalik.utils.isObject(events) ) {
						Takalik.utils.each(events, function each(fn,evt){
							addEvent(element,evt,fn)
						});
					}
				}
			}
		},
		extend:function extend(superClass,subClass,callback,context){
			Takalik.utils.each(superClass,function each(el){
				subClass[el]=superClass[el];
			});
		}
	};

	function executeSql(database,request,data,success,error){
		database.transaction(function (tx){tx.executeSql(request,data,function (a,b){success(b);}, function (a){error(a);});});
		return false;
	}

	function ModelTable(db,properties){
		var nameTable=properties.name,
			newTable={},
			fields=properties.fields.map(function (property) {
  				return property.name + ' ' + (property.type || "TEXT");
			});

		executeSql(db.db,"CREATE TABLE IF NOT EXISTS " + nameTable + " ( "+ fields.join(", ") +" ) ", [], function (){}, function (){});
		console.log("CREATE TABLE IF NOT EXISTS " + nameTable + " ( "+ fields.join(", ") +" ) ");
		db.tables.push(nameTable);
		
		var fields_names = fields.map(function (field){
			var field_={};
			var isPrimaryKey=function isPrimaryKey(element){
				if(element.match("PRIMARY KEY"))
				{
					return true;
				}
				return false;	
			};

			var fieldType = function fieldType(element){
				if(element.toUpperCase().match("INTEGER|TEXT|NULL|REAL|BLOB")){
					return element.toUpperCase().match("INTEGER|TEXT|NULL|REAL|BLOB")[0];
				}
				return "TEXT";
			};
			field_.name = field.split(" ")[0];
			field_.isPrimaryKey = function (){
				return isPrimaryKey(field);
			};
			field_.type = fieldType(field);
			return field_;
		});
		
		function fieldsTableToString(names){
			var _elements = [];
			names.forEach(function (val){
				if(!val.isPrimaryKey()){
					_elements.push(val.name);
				}
			});
			return _elements;
		};
		function fieldsTableType(names){
			var _elements = {};

			names.forEach(function (val){
				if(!val.isPrimaryKey()){
					_elements[val.name] = val.type;
				}
			});
			return _elements;
		}

		newTable.find = function (data,callback){
			var elements = data.elements,
				request;
			
			request = "SELECT " + elements.join(",") + " FROM " + nameTable;

			if(data.condition) request += " WHERE " + data.condition.join(" ");
			if(data.limit) request +=" LIMIT "+data.limit;

			executeSql(db.db,request,[], function (result){
				if(result.rows && result.rows.length > 1){
					var results = [];
					for(var i = 0,len = result.rows.length; i < len ; i++){
						results.push(result.rows.item(i));
					}
					callback(results);
				}
				else
				{
					callback(result.rows.item(0));
				}
			}, function (error){
				callback(null);
			});
			return newTable;
		};

		newTable.update=function (options,callback){
			var elements=[],
				request="UPDATE " + nameTable + " SET ";

			for(var i in options.elements)
			{
				for(var j in options.elements[i])
				{
					elements.push(j+"="+options.elements[i][j]);	
				}
			}
			request += elements.join(",");
			if(options.condition != undefined)
			{
				request += " WHERE " + options.condition.join(" ");	
			}

			executeSql(db.db,request,[], function (result){
				console.log(result);
			}, function (e){
				console.log(e);
			});
		};

		newTable.delete = function (properties,callback){
			var request = "DELETE FROM " + nameTable;
			
			if(properties.condition != undefined) request+=" WHERE "+properties.condition.join(" ");

			executeSql(db.db,request,[], function (a){
				if(a.rowsAffected > 0) return callback(true);
				return callback(false);
			}, function (e){
				callback(e);
			});
		};

		newTable.add=function add(elements, callback){
			var _elements = fieldsTableToString(fields_names),
				_elementsToString = _elements.join(", "), 
				_elementsType = fieldsTableType(fields_names),
				request = "INSERT INTO "+nameTable+"("+ _elementsToString +") VALUES ",
				values = [],
				rowInsert = 0,
				rowNotInserted = 0,
				temporal = [];

			if(Takalik.utils.isObject(elements)) elements = [elements];
			
			for(var i in elements)
			{
				for(var j in elements[i])
				{
					if(_elementsToString.match(j))
					{
						if(_elementsType[j] == "TEXT")
						{
							temporal.push("'"+(elements[i][j]).trim()+"'");	
							continue;
						}
						temporal.push((elements[i][j]).trim());	
					}
					continue;
				}
				values.push("INSERT INTO "+nameTable + "("+ _elementsToString +") VALUES ("+ temporal.join(", ") +")")
				temporal.length = 0;
			}

			var returnCallback=function returnCallback(count){
				if(count == values.length){
					callback({
						rowsToInsert: values.length,
						rowsInserted: rowInsert,
						rowsFails: rowNotInserted,
						finished: true
					});
				}
			}
			
			values.forEach(function (val){
				executeSql(db.db, val,[], function (a){
					rowInsert += 1;
					returnCallback(rowInsert);
				}, function (a){
					rowNotInserted += 1;
					returnCallback(rowInsert);
				});
			});

		};
		return newTable;
	};

	function ModelDB(props){
		this.name=props.name;
		this.space = props.space.detail.size + " " +props.space.detail.measure;
		this.description = props.description;
		this.version = props.version;
		this.db = window.openDatabase(props.name,props.version,props.description,props.space.size);
		this.tables = [];
		return this;
	}
	ModelDB.prototype = {
		__defineTable: function __defineTable(table){
			var DB = this;

			var exists_table = false;
			if(DB.tables.length > 0){
				Takalik.utils.each(DB.tables,function each(property){
					if(property==table.name){exists_table=true;return console.error("'"+table.name+"'"+" already exists in database");}
				},this);
			}
			if(!exists_table) DB[table.name]=new ModelTable(DB,table);
		},
		createTable: function createTable(properties){
			if(!Takalik.utils.isDefined(properties)) return console.error("Table's information is not defined");
			if(Takalik.utils.isObject(properties)) properties=[properties];

			Takalik.utils.each(properties, function each(property,value){
				this.__defineTable(property);
			},this);
		},
	};
	Takalik.localSQL={
		createDB: function createDB(props){
			if(!Takalik.utils.isDefined(props)) console.error("Information of database is not defined");
			if(!Takalik.utils.isObject(props)) console.error("Information of database is not an object");

			if(props.space){
				var _measureAccepted={
					"byte": function byte(value){return value;},
					"kb": function kb(value){return value*1024},
					"mb": function mb(value){return value*1024*1024}
				};

				if(props.space.measure in _measureAccepted){
					props.space={
						detail: props.space,
						size: _measureAccepted[props.space.measure](props.space.size)
					};
				}
			} else{console.error("Space of database is not defined");}
			return new ModelDB(props);
		}
	}


	Takalik.localIndexedDB = {
		createDB: function createDB(){

		},
		destroyDB: function destroyDB(){

		}
	};

}).call(this);