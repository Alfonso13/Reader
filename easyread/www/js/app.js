angular.module('starter', ['ionic', 'ngMaterial'])

.run(function($ionicPlatform,User,$state,$location) {
  $ionicPlatform.ready(function () {
    if(window.cordova&&window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})
.config(function config($stateProvider,$urlRouterProvider,$mdThemingProvider){
  $mdThemingProvider.definePalette('primaryColor', {
    '50': 'e3f2fd',
    '100': 'bbdefb',
    '200': '90caf9',
    '300': '64b5f6',
    '400': '42a5f5',
    '500': '2196f3',
    '600': '1e88e5',
    '700': '1976d2',
    '800': '1565c0',
    '900': '0d47a1',
    'A100': '82b1ff',
    'A200': '448aff',
    'A400': '2979ff',
    'A700': '2962ff',
    'contrastDefaultColor': 'light',
    'contrastDarkColors': ['50','100','200','300','400','A100'],
    'contrastLightColors': undefined
  });
  $mdThemingProvider.definePalette('accentColor', {
    '50': 'ffebee',
    '100': 'ffcdd2',
    '200': 'ef9a9a',
    '300': 'e57373',
    '400': 'ef5350',
    '500': 'f44336',
    '600': 'e53935',
    '700': 'd32f2f',
    '800': 'c62828',
    '900': 'b71c1c',
    'A100': 'ff8a80',
    'A200': 'ff5252',
    'A400': 'ff1744',
    'A700': 'd50000',
    'contrastDefaultColor': 'light',
    'contrastDarkColors': ['50','100','200','300','400','A100'],
    'contrastLightColors': undefined
  });
  
  $mdThemingProvider.theme("default").primaryColor("primaryColor");
  $mdThemingProvider.theme('default').accentColor('accentColor');
  
  $stateProvider
  .state('login', {
    url: '/login',
    templateUrl: 'templates/login.html',
    cache: false,
    controller: 'CrtlLogin'
  })
  .state('register', {
    url: '/register',
    cache: false,
    templateUrl: 'templates/register.html',
    controller: 'RegisterCrtl'
  })
  .state('app', {
    url: '/app',
    templateUrl: 'templates/menu.html',
    controller: 'CrtlMenu'
  })
  .state('app.books', {
    url: '/app/books',
    cache: false,
    resolve: {
      books: function books($http,User){
        return $http.get("http://serviceread.herokuapp.com/books/"+User.getUser().id+"");
      }
    },
    views: {
      'content': {
        templateUrl: 'templates/books.html',
        controller: 'BooksCrtl'
      }
    }
  })
  .state('app.configuration', {
    url: '/app/configuration',
    cache: false,
    views: {
      'content': {
        templateUrl: 'templates/config.html',
        controller: 'ConfigCrtl'
      }
    }
  })
  .state('app.lectures', {
    url: '/app/lectures',
    cache:false,
    views: {
      'content': {
        templateUrl: 'templates/lectures.html',
        controller: 'LecturesCrtl'
      }
    }
  });
  $urlRouterProvider.otherwise('login');
})
.controller('CrtlLogin', function CrtlLogin($scope,$state,User){
  if(User.getUser()) {
    $state.go("app.books");
  }
})
.controller('FormLoginCrtl', function FormLoginCrtl($scope,$state,$mdToast,$http,User){

  $scope.user = null;
  $scope.password = null;

  $scope.login = function login(){
    if( $scope.user != "" && $scope.password != "" ) {
      $http
      .get('http://serviceread.herokuapp.com/login/'+ JSON.stringify({user:$scope.user,password:$scope.password}) +'')
      .success(function success(data){
        if(data.status == 'ok') {
          User.addUser({
            user:$scope.user,
            id:data.data.ID
          });
          $state.go("app.books");
        }
        else {
          $mdToast.show({
            template: "<md-toast class='md-whiteframe-z2 accentColor'> <h3 class='no-margin text-white'>{{message}}</h3> </md-toast>", 
            controller: function ($scope,locals){
              $scope.message = locals.message; 
            },
            locals: {message: data.reason}, 
            hideDelay: 2000 
          }); 
        }
      })
      .error(function error(error){
        console.log(error);
      });
    }
    else {
      $mdToast.show({
          template: "<md-toast class='md-whiteframe-z2 accentColor'><h3 class='no-margin text-white' style='font-size: 1.1em;'>:( Tell us your user and password </h3></md-toast>",
          controller: function ($scope){},
          hideDelay: 2000
      });
    }
  };
  $scope.register = function register(){
    $state.go('register');
  };
})
.controller('CrtlAddUser', function ($scope,$http,$mdDialog,$mdToast,$state,$timeout,User){
  $http.defaults.useXDomain = true;
  $scope.name = null;
  $scope.lastname = null;
  $scope.username = null;
  $scope.password = null;
  $scope.email = null;
  $scope.register = function register(ev){
    if( ($scope.name != "" && $scope.name != null) && ($scope.lastname != "" && $scope.lastname != null) && ($scope.username != "" && $scope.username != null) && ($scope.password != "" && $scope.password != null) && ($scope.email != "" && $scope.email != null)) {
      $http
      .post("http://serviceread.herokuapp.com/newuser?callback=JSON_CALLBACK", {name: $scope.name, username: $scope.lastname, password: $scope.password, lastname:$scope.lastname,email:$scope.email})
      .success(function success(data){
        if(data.status == 'ok') {
          var emptyInputsRegister = function emptyInputsRegister(){
            $scope.name = null;
            $scope.username = null;
            $scope.password = null;
            $scope.lastname = null;
            $scope.email = null;
          };

          $mdDialog.show({
            templateUrl: 'templates/dialogs/login/registerdialog.html', 
            controller: function RegisterCrtlDialog($scope){
              $scope.hide = function hide(){
                emptyInputsRegister();
                $mdDialog.hide()
              };
              $scope.comeHome = function comeHome(){
                User.addUser({id:data.user.id,user:data.user.name});
                emptyInputsRegister();
                $mdDialog.hide();
                $timeout(function q(){
                  $state.go("app.books");
                },1000);
              };
            }, 
            targetEvent: ev, 
            hasBackdrop: true,
            clickOutsideToClose: false
          });
        }
        else {
          $mdToast.show({
            template: "<md-toast class='md-whiteframe-z2 accentColor'> <h3 class='no-margin text-white'>{{message}}</h3> </md-toast>",
            controller: function ToastCrtl($scope,locals){$scope.message = locals.message;},
            locals:{message: data.reason},
            hideDelay: 3000
          });
        }
      })
      .error(function error(error){
        $mdToast.show({
          template: "<md-toast class='md-whiteframe-z2'> <h3 class='no-margin text-white'>AN ERROR OCURRED</h3> </md-toast>",
          controller: function ToastCrtl(){},
          hideDelay: 3000
        });
      })
    }
    else {
      $mdToast.show({
        template: "<md-toast class='md-whiteframe-z2 accentColor'> <h3 class='no-margin text-white'>Please! Enter your information </h3></md-toast>",
        controller: function ToastCrtl($scope){},
        hideDelay: 3000
      });
    }
  };
})
.controller('RegisterCrtl', function RegisterCrtl($scope,$http,$mdDialog){
  $scope.back = function back(){window.history.back();};
})
.controller('CrtlMenu', function CrtlMenu($scope,$state,User,$mdToast,$timeout,$http){
  $scope.config = function config(){
    $state.go("app.configuration");
    /**/
    
  };
  $scope.logout = function logout(){
    User.destroyUser();
    $mdToast.show({
      controller: function ToastCrtl(){},
      templateUrl: 'templates/toast/logout.html'
    });
    $timeout(function q(){
      $mdToast.hide();
      $state.go("login");
    },2000);

  };
  $scope.books = function books(){
    $state.go("app.books");  
  };
  $scope.lectures = function lectures(){
    $state.go("app.viewlecture");
  };
})
.controller('BooksCrtl', function BooksCrtl($scope,books,$mdDialog,$state,$http,Lectures,Books,$q,User){
  if(!User.getUser()) {
    $state.go("login");
  }

  $scope.books = [];
  $scope.theresbooks = function theresbooks(){
    if($scope.books.length == 0) return true;
    return false;
  };

  $scope.$watchCollection(function watch() {
    return Books.book;
  }, function watchHandler(newValue,oldValue,scope){
    if(newValue.length > 0) {
      var id = newValue[0].id;
      $http
      .get("http://serviceread.herokuapp.com/uniquebook/"+id+"")
      .success(function success(data) {
        $scope.books.push(data.book);
        Books.reset();
      })
      .error(function error(){
        console.log(arguments);
      })
    }
  });

  $scope.$watchCollection(function watch(){
    return Books.deletedBook;
  }, function watchHandler(newValue,oldValue,scope){
    if(newValue.length > 0) {
      var id = newValue[0].id;
      angular.forEach($scope.books, function each(value,key){
        if(value.ID == id) {this[key].enable = 0;}
      },$scope.books);
      Books.resetDeletedBook();
    }
  });

  angular.forEach(books.data.books,function each(value,key) {
    this.push(value);
  },$scope.books);

  $scope.lecture = function lecture($event){
    var idbook = $event.target.getAttribute("data-idbook");
    var namebook = $event.target.getAttribute("data-namebook");
    var authorbook = $event.target.getAttribute("data-authorbook");
    Lectures.destroyBookOfLectures();
    Lectures.addBookOfLectures(idbook,namebook,authorbook);
    $state.go("app.lectures");
  };

  $scope.showBook = function showBook($event){
    var idbook = $event.target.getAttribute("data-idbook");

    $mdDialog.show({
      controller: 'ShowBookDialog',
      templateUrl: 'templates/dialogs/books/showbook.html',
      targetEvent: $event,
      locals:{idbook:idbook},
      hasBackdrop: true
    });
  };

  $scope.addBook = function addBook(ev){
    $mdDialog.show({
      controller: 'AddBookCrtl',
      templateUrl: 'templates/addbook.html',
      targetEvent: ev,
      hasBackdrop: true
    });
  };
})
.controller('AddBookCrtl', function AddBookCrtl($scope,$http,User,$mdDialog,Books,$timeout,$mdToast,$q){
  $scope.initialsheet = null;
  $scope.finalsheet = null;
  $scope.bookname = "";
  $scope.bookauthor = "";

  $scope.errorfinalsheet = false;
  $scope.validatefinalsheet = function validatefinalsheet(){
    return $scope.errorfinalsheet;
  };

  $scope.errorbookname = false;  
  $scope.validatebookname = function validatebookname(){
    return $scope.errorbookname;
  };

  $scope.errorbookauthor = false;
  $scope.validatebookauthor = function validatebookauthor(){
    return $scope.validatebookauthor;
  };

  $scope.errorinitialsheet = false;
  $scope.validateinitialsheet = function validateinitialsheet(){
    return $scope.errorinitialsheet;
  };

  $scope.error = false;
  $scope.validate = function validate(){
    return $scope.error;
  };

  $scope.errorrequest = false;
  $scope.validateerrorrequest = function validateerrorrequest(){
    return $scope.errorrequest;
  };

  $scope.hide = function hide() {
    $mdDialog.hide();
  };
  $scope.saveBook = function saveBook(){
    var iduser = User.getUser().id;

    if($scope.bookname != "" && $scope.bookauthor != "" && $scope.initialsheet != "" && $scope.finalsheet != "") 
    {
      if($scope.initialsheet > $scope.finalsheet || $scope.initialsheet == $scope.finalsheet) {$scope.error = true;}
      else {
        $scope.error = false;
        $scope.errorbookname = false;
        $scope.errorbookauthor = false;
        $scope.errorinitialsheet = false;
        $scope.errorfinalsheet = false;
        $timeout(function q(){
          $http
          .post("http://serviceread.herokuapp.com/savebook?callback=JSON_CALLBACK", {book:$scope.bookname, author:$scope.bookauthor, initialsheet:$scope.initialsheet, lastsheet:$scope.finalsheet, id:iduser})
          .success(function success(data) {
            if(data.status == 'ok') {
              Books.addedBook({id:data.idBook});
              $mdDialog.hide();
              $mdToast.show({
                controller: function ToastCrtl($scope){
                  $scope.message = "Your new book was added";
                },
                templateUrl: 'templates/toast/books/newbook.html',
                hideDelay: 4000
              });
            }
            else {
              $mdDialog.hide();
              $mdToast.show({
                controller: function ToastCrtl($scope){
                  $scope.message = data.reason;
                },
                templateUrl: 'templates/toast/books/newbook.html',
                hideDelay: 4000
              });
            }
          })
          .error(function error(error){
            $scope.errorrequest=true;
          });
        },1000);
      }
    }
    else {
      if($scope.bookname.trim() == "") {$scope.errorbookname = true; }
      if($scope.bookauthor.trim() == ""){$scope.errorbookauthor = true;}
      if($scope.initialsheet == null){
        $scope.errorinitialsheet = true;
      }
      if($scope.finalsheet == null){
        $scope.errorfinalsheet = true;
      }
    }

  };
})
.controller('ShowBookDialog', function ShowBookDialog($scope,$mdDialog,$http,locals,$q,$mdToast,User,Books){
  $scope.hide = function hide(){
    $mdDialog.hide();
  };
  $scope.percentageBook = 0;
  $scope.lastpagereaded = 0;
  $scope.pagesbook = 0;
  $scope.initShowBook = function initShowBook(){
    /*var requests = [$http.get("http://serviceread.herokuapp.com/statisticsbooks/"+locals.idbook+""),$http.get("http://serviceread.herokuapp.com/lastpagereaded/"+locals.idbook+""),$http.get("http://serviceread.herokuapp.com/pagesbook/ "+locals.idbook+"")] 

    $q.all(requests).then(function response(results){
      var statistics = results[0];
      var lastpagereaded = results[1];
      var pagesbook = results[2];

      if(statistics.data.status == 'ok') {$scope.percentageBook = parseFloat(statistics.data.percentage);}
      else {$scope.percentageBook = ":("; }
      
      if(lastpagereaded.data.status == 'ok') {$scope.lastpagereaded = lastpagereaded.data.pages; } 
      else {$scope.lastpagereaded = ":(";}
      if(pagesbook.data.status == 'ok'){ $scope.pagesbook = pagesbook.data.pages;}
      else {$scope.pagesbook = ":(";}

    });*/
  };
  $scope.deleteBook = function deleteBook(){
    var iduser = User.getUser().id;
    
    $http
    .delete("http://serviceread.herokuapp.com/deletebook/"+locals.idbook+"")
    .success(function success(data){
      if(data.status == 'ok') {
        Books.deleteBook({id:locals.idbook});
        $mdDialog.hide();
        $mdToast.show({
          controller: function ToastCrtl($scope){$scope.message = "YOUR BOOK WAS REMOVED";},
          templateUrl: 'templates/toast/books/messagedeletebook.html',
          hideDelay: 4000
        });
      }
      else {
        $mdDialog.hide();
        $mdToast.show({
          controller: function ToastCrtl($scope){
            $scope.message = data.reason;
          },
          templateUrl: 'templates/toast/books/messagedeletebook.html',
          hideDelay: 4000
        });
      }
    })
    .error(function error(){
      //pendiente
      console.log(arguments);
    });
  };
})
.controller('LecturesCrtl', function LecturesCrtl($scope,$http,Lectures,$mdDialog,LectureState,$q,Books,User,$state,Lectures){
  if(!User.getUser()) {
    $state.go("login");
  }
  $scope.back = function back(){
    window.history.back();
  };

  $scope.lectures=[];
  
  $scope.isbookcomplete = 0;
  $scope.namebook = null;
  
  $scope.$watch(function callback(){
    return Books.isBookComplete();
  }, function listener(newValue,oldValue){
    if(newValue) {$scope.isbookcomplete = 1;}
    else{$scope.isbookcomplete = 0}
  });

  $scope.$watchCollection(function (){return LectureState.lecture;}, 
    function renderLecture(newValue,oldValue){
      if(newValue.length > 0) 
      {
        var id = newValue[0].id;
        $http
        .get("http://serviceread.herokuapp.com/uniquelecture/"+id+"")
        .success(function success(data){
          $scope.lectures.push(data.data);
          LectureState.reset();
        })
        .error(function error(){
          //pendiente
          console.log(arguments);
        }); 
      }
    }
  );
  $scope.addlecture = function addlecture(ev){
    
    $mdDialog.show({
      templateUrl: 'templates/dialogs/lectures/addlecture.html',
      controller: 'CrtlAddLecture',
      targetEvent: ev,
      hasBackdrop: true
    });
  };

  $scope.initlectures = function initlectures(){
    var namebook = Lectures.getBooksOfLectures().namebook;
    var authorbook = Lectures.getBooksOfLectures().authorbook;
    $scope.namebook = namebook;
    $scope.authorbook = authorbook;
    var book=Lectures.getBooksOfLectures().id;
    var req = [$http.get("http://serviceread.herokuapp.com/lectures/"+book+""),$http.get("http://serviceread.herokuapp.com/isbookcomplete/"+book+"")];

    $q.all(req).then(function succes(requests) {
      var isbookcomplete = requests[1].data.statusbook; 
      var lectures = requests[0]; 
      $scope.isbookcomplete = Number(isbookcomplete);
      angular.forEach(lectures.data.lectures, function each(lect){
        this.push(lect); 
      },$scope.lectures);
    });
  };
  
  $scope.book_statics = function book_statics(ev){
    var idlecture = ev.target.getAttribute("data-idlecture");
    var idbook = ev.target.getAttribute("data-idbook");
    $mdDialog.show({
      templateUrl: 'templates/dialogs/lectures/statistics.html',
      controller: 'CrtlStatisticsLectures',
      targetEvent: ev,
      locals: {
        idlecture:idlecture,
        idbook:idbook
      }
    });
  };
})
.controller('CrtlAddLecture', function CrtlAddLecture($scope,$http,Lectures,$mdDialog,LectureState,$q,Books,$timeout){
  var dateclass = new Date();
  var day = dateclass.getDate();
  var month = (dateclass.getMonth()+1) < 10 ? "0"+(dateclass.getMonth()+1) : (dateclass.getMonth()+1);
  var year = dateclass.getFullYear();
  
  var idbook = Lectures.getBooksOfLectures();
  $scope.datetime = year + "/" + month + "/" + day;
  
  $scope.lastpagereaded = 0;

  $scope.initAddLecture = function initAddLecture(){
    $http
    .get("http://serviceread.herokuapp.com/lastpagereaded/"+idbook.id+"")
    .success(function success(data){
      if(data.status == 'ok'){$scope.lastpagereaded = data.pages;}
      else{$scope.lastpagereaded = "(";}
    })
    .error(function error(){
      //pendiente
      console.log(arguments);
    });
  };
  $scope.addLecture = function addLecture(ev){
    var date = Takalik.utils.getElement("#datelecture").value;
    var pages = Takalik.utils.getElement("#lastpagereaded").value;
    if(date.trim() != "" && pages.trim() != "") {
      
      $http
      .post("http://serviceread.herokuapp.com/addlecture?callback=JSON_CALLBACK",{date:date, pages:pages,idbook:idbook.id})
      .success(function success(data){
        if(data.status == 'ok') {
          LectureState.addedLecture({id:data.idLecture});

          if(data.isbookcomplete) {
              Books.setBookComplete(true);
              $mdDialog.hide();
              $timeout(function q(){
                $mdDialog.show({
                  controller: function CrtlDialog($scope){
                    $scope.hide = function hide(){
                      $mdDialog.hide();
                    };
                  },
                  templateUrl: 'templates/dialogs/books/bookcompleted.html',
                  targetEvent: ev
                });
              },2000);
          }
          else{$mdDialog.hide();}
        }
        else {

        }
      })
      .error(function error(){
        //pendiente
        console.log(arguments);
      });
    }
  };
  $scope.hide = function hide(){
    $mdDialog.hide();
  };
})
.controller('CrtlStatisticsLectures', function CrtlStatisticsLectures($scope,locals,$http,$mdDialog){
  $scope.percentageLecture = 0;
  $scope.hide = function hide(){
    $mdDialog.hide();
  };

  $scope.initStatisticsLectures = function initStatisticsLectures($event){
    $http
    .get("http://serviceread.herokuapp.com/statisticslectures/"+locals.idlecture+"/"+locals.idbook+"")
    .success(function success(data){
      $scope.percentageLecture = data.percentage;
    })
    .error(function error(){
      //pendiente
      console.log(arguments);
    });
  };
})
.controller('ConfigCrtl', function ConfigCrtl($scope,User,$http,$state){
  if(!User.getUser()) {
    $state.go("login");
  }

  $scope.back = function back(){
    window.history.back();
  };
})
.controller('ConfigUserCrtl', function ConfigUserCrtl($scope,$http,User,$mdToast,$mdDialog,$timeout,$state){
  if(!User.getUser()) {
    $state.go("login");
  }
  $scope.name = " ";
  $scope.lastname = " ";
  $scope.email = " ";
  $scope.username = " ";
  $scope.password = null;



  $scope.initConfigCrtl = function initConfigCrtl(){
    var iduser = User.getUser().id;
    $http
    .get("http://serviceread.herokuapp.com/userinformation/"+iduser)
    .success(function success(data){
      var user = data.user;
      var person = data.person;

      $scope.name = person.name;
      $scope.lastname = person.lastname;
      $scope.email = person.email;
      $scope.username = user.name;
    })
    .error(function error(){
      console.log(arguments);
    });
  };
  $scope.editField = function editField(target){
    var element = target.target;
    var user = User.getUser().id;
    if(target.target.tagName.toLowerCase() == "button") {
      element = target.target.children[0];
    }

    if(angular.element(element).hasClass("ion-edit")) {
      if(element.getAttribute("data-name") == "password") {
        $timeout(function (){
          $mdDialog.show({
            templateUrl: 'templates/dialogs/config/change_password.html',
            controller: function CrtlDialog($scope,$http){
                
                $scope.oldPassword = null;
                $scope.newPassword = null;
                $scope.repeatPassword = null;
                $scope.hide = function hide(){                
                  $mdDialog.hide();
                  document.getElementById("NameUser").focus();
                };

                $scope.ok = function ok(){

                   if($scope.oldPassword != null && $scope.newPassword != null && $scope.repeatPassword != null) {
                      if($scope.newPassword == $scope.repeatPassword) {
                        $http
                        .put("http://serviceread.herokuapp.com/setuser/"+JSON.stringify({oldPassword:$scope.oldPassword,newPassword: $scope.newPassword})+"/"+ user +"/"+element.getAttribute("data-name"))
                        .success(function success(data){
                          if(data.status == 'ok') {
                            $mdDialog.hide();

                            $mdToast.show({
                              template: "<md-toast class='primaryColor'><h3 class='no-margin no-padding text-white'>Your {{name}} has been changed</h3></md-toast>",
                              controller: function ToastCrtl($scope,locals){
                                $scope.name = locals.name;
                              },
                              locals: {
                                name: element.getAttribute("data-name")
                              },
                              hideDelay: 2000
                            });
                          }
                          else {
                            alert("La antigua contraseña que ingresaste no es la tuya.  Por favor, no nos engañes, eso nos duele :'(");
                          }
                        })
                        .error(function error(){
                          console.log(arguments);
                        });
                      }
                      else {
                        alert("Las contraseñas no coinciden");
                      }
                   }
                   else {
                      alert("Campos vacios");
                   }
                };
            },
            targetEvent: target,
            clickOutsideToClose: false
          });
        },200);
      }
      else {
        Takalik.utils.getElement("#"+element.getAttribute("data-idfield")).removeAttribute("disabled");
        angular.element(element).removeClass("ion-edit").addClass("ion-checkmark text-primary-color");
      }
    }
    else {
      $http
      .put("http://serviceread.herokuapp.com/setuser/"+$scope[element.getAttribute("data-name")]+"/"+user+"/"+element.getAttribute("data-name"))
      .success(function success(data){
        if(data.status == 'ok') {
          $mdToast.show({
            template: "<md-toast class='primaryColor'><h3 class='no-margin no-padding text-white'>Your {{name}} has been changed</h3></md-toast>",
            controller: function ToastCrtl($scope,locals){
              $scope.name = locals.name;
            },
            locals: {
              name: element.getAttribute("data-name")
            },
            hideDelay: 2000
          });
          angular.element(element).removeClass("ion-checkmark text-primary-color").addClass("ion-edit grey"); 
          Takalik.utils.getElement("#"+element.getAttribute("data-idfield")).setAttribute("disabled","true");
        }
      })
      .error(function error(){
        console.log(arguments);
      });
    }
  };

})
.factory("Lectures", function Lectures() {
  var app_lectures = {
    addLectures: function addlectures(lectures){
      if(lectures && lectures.length > 0) {
        if(lectures.length > 0) {
          localStorage["lectures"] = JSON.stringify({lectures:lectures});
        }
        else {
          localStorage["lectures"] = JSON.stringify({lectures:[]});
        }
      }
    },
    addBookOfLectures: function addBookOfLectures(book,namebook,authorbook){
      if(book && namebook) {
        return localStorage["temporalbook"] = JSON.stringify({id:book,namebook:namebook,authorbook:authorbook});
      }
      return book;
    },
    getBooksOfLectures: function getBooksOfLectures(){
      if(JSON.parse(localStorage["temporalbook"]).id) {
        return JSON.parse(localStorage["temporalbook"]);
      }
      return null;
    },
    destroyBookOfLectures: function destroyBookOfLectures(){
      localStorage["temporalbook"] = JSON.stringify({id:null});
    },
    getLectures: function getLectures(){
      return localStorage["lectures"] ? localStorage["lectures"] : null;
    },
    destroyLectures: function destroyLectures(){
      return localStorage["lectures"] = null;
    }
  };
  return app_lectures;
})
.factory("User", function User(){
    var _exists = function _exists(){
      if(!!localStorage["User"] && localStorage["User"] != "null") return true;
      return false;
    };
    var User = {
    addUser: function addUser(user){
      if(_exists()) {
        return user;
      }
      return localStorage["User"] = JSON.stringify(user);
    },
    getUser: function getUser(){
      if(localStorage["User"]) return JSON.parse(localStorage["User"]);
      return null;
    },
    destroyUser: function destroyUser(){
      return localStorage["User"] = null;
    }
  };
  return User;
})
.service('Books', function Books(){
  this.book = [];
  this.deletedBook = [];
  this.iscompletebook = false;
  this.addedBook = function addedBook(book){
    this.book.push(book);
  };
  this.deleteBook = function deleteBook(book){
    this.deletedBook.push(book);
  };
  this.isBookComplete = function isBookComplete(){
    return this.iscompletebook;
  };
  this.setBookComplete = function setBookComplete(state){
    this.iscompletebook = state;
  };
  this.resetDeletedBook = function resetDeletedBook(){
    this.deletedBook.length = 0;
  };
  this.reset = function reset(){
    this.book.length = 0;
  };
})
.service('LectureState', function LectureState(){
  this.lecture=[];
  this.addedLecture=function addedLecture(lecture) {
    this.lecture.push(lecture);
  };
  this.reset=function reset(){
    this.lecture.length=0;
  };
});