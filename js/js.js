$(document).ready(function () {
    var app = {}, Word, currentLangId,
        displayDataFinder, wordStorage, dictionaryStorage,
        progressPattern = [1, 1, 2, 3, 5, 7, 9, 11, 18];

    $("#return-button").hide();
    $("#description_of_add_dictionary").hide();
    $("#description_of_add_word").hide();
    $("#description_of_game").hide();
    $("#description_choices").hide();
    $("#statistic").hide();

    Word = function (source, destination, step, langId) {
        this.id = (new Date()).getTime();
        this.source = source; // word to translate
        this.destination = destination; // translation of the word
        this.displayDate = null;
        this.step = step;
        this.langId = langId;
    };

    Dictionary = function (id, trFrom, trTo) {
        this.id = id;
        this.trFrom = $.trim(trFrom); //translation from which language
        this.trTo = $.trim(trTo); //translation to destination language
    };

    breadCrumb = {
        paths:[], //store object {label :'', viewToDisplay : ''}
        $el:$("#breadcrumb"),
        addPath:function (path) {
            this.paths.push(path);

            return this;
        },
        clear:function () {
            this.paths = [];
            return this;
        },
        revertTo:function (position) {
            this.paths = this.paths.splice(0, position + 1);
            this.render();
        },
        render:function () {
            var crumb, i, that = this, fn;

            this.$el.empty();

            for (i = 0; i < this.paths.length - 1; i++) { //not very optimal but easy and fast
                crumb = $('<a href="#"></a>').text(this.paths[i].label);

                fn = function (position, view) {
                    return function () {
                        $(".jqs-view").hide();
                        $("#view-" + view).show();
                        breadCrumb.revertTo(position);

                        if (that.paths.length === 1) {
                            $("#return-button").hide();
                            $("#description").show();
                        }
                        if (that.paths[position].viewToDisplay === "game-mode") {
                            $("#description_choices").show();
                        }

                    }
                }(i, this.paths[i].viewToDisplay);

                crumb.click(fn);
                this.$el.append(crumb);
                crumb.wrap($('<li></li>'));
                crumb.after($('<span> / </span>').addClass('divider'));
            }
            crumb = $('<li></li>').text(this.paths[this.paths.length - 1].label);
            this.$el.append(crumb);


        }
    };

    displayDataFinder = {
        /**
         * Determine when word should be displayed next time
         * @param progress array with key = step, value future day when word should be displayed
         * @param step - integer
         *
         * @return display date or -1 if there is no future display date for this step
         */
        findDate:function (progress, step) {
            var dayInterval, date = new Date(), out = -1;

            if (progress.length > step) {
                dayInterval = progress[step];
                out = new Date(date.getFullYear(), date.getMonth(), date.getDate() + dayInterval);
            }

            return out;
        }
    };

    /**
     * Used to find word in word set
     */
    wordFinder = {
        /**
         * Find a word to display
         * @param words array
         * @param langId int
         * @param date date
         *
         * @return Word|null
         */
        find:function (words, langId, date) {
            var out = this.findAllToDisplayToday(words, langId, date);

            if (out.length === 0) {
                return null;
            } else {
                return out.pop();
            }
        },

        /**
         * Find all words to display in transferred date
         * @param words
         * @param langId
         * @param date
         *
         * @return {Array}
         */
        findAllToDisplayToday:function (words, langId, date) {
            var i, word, displayDate, out = [], displayDateArray;

            for (i = 0; i < words.length; i++) {
                word = words[i];
                displayDateArray = word.displayDate.slice(0,10).split("-");
                displayDate = new Date(displayDateArray[0], displayDateArray[1]-1, displayDateArray[2]);
                displayDate.setDate(displayDate.getDate() + 1);

                if ((displayDate.getTime() <= date.getTime()) && (word.langId === langId)) {
                    out.push(word);
                }
            }

            return out;
        },
        /**
         * Find all words to display
         * @param words array
         * @param langId int
         *
         * @return array
         */
        findAll:function (words, langId) {
            var i, word, out = [];

            for (i = 0; i < words.length; i++) {
                word = words[i];
                if (word.langId === langId) {
                    out.push(word);
                }
            }

            return out;
        }
    };

    wordStorage = {
        localStorageKey:'words',

        /**
         * Add word to local storage
         * @param word
         */
        addWord:function (word) {
            var json, words = this.getWords();

            words.push(word);
            json = JSON.stringify(words); //object to json string
            localStorage.setItem(this.localStorageKey, json);
        },
        /**
         * Return array of words
         * @return array of words
         */
        getWords:function () {
            var json, out = [];

            json = localStorage.getItem(this.localStorageKey); //string
            if (json !== null) {
                out = JSON.parse(json);
            }

            return out;
        },

        /**
         * Remove word from array of words
         * @param word object to remove
         */
        removeWord:function (word) {
            var words = this.getWords(),
                rest = [];

            for (var i = 0; i < words.length; i++) {
                if (words[i].id !== word.id) {
                    rest.push(words[i]);
                }
            }

            json = JSON.stringify(rest);
            localStorage.setItem(this.localStorageKey, json);
        }
    };
    dictionaryStorage = {
        localStorageKey:'dictionaries',
        /**
         * Add new dictionary to localStorage
         * @param dictionary
         */

        addNewDictionary:function (dictionary) {
            var json, dictionaries = this.getDictionaries();

            dictionaries.push(dictionary);
            json = JSON.stringify(dictionaries); //object to json string
            localStorage.setItem(this.localStorageKey, json);
        },
        /**
         * Return array of dictionaries
         * @return array of dictionaries
         */
        getDictionaries:function () {
            var json, out = [];

            json = localStorage.getItem(this.localStorageKey); //string
            if (json !== null) {
                out = JSON.parse(json);
            }

            return out;
        }
    };


    dictionaryFinder = {
        findById:function (id) {
            var collection = dictionaryStorage.getDictionaries();

            id = parseInt(id, 10);
            return _.findWhere(collection, {id:id});
        }
    }

    /**
     * Get dictionary from the localStorage
     */
    app.listDictionaries = function () {
        var dictionaries = dictionaryStorage.getDictionaries(), i,
            ul = $("div#view-select-language ul");

        ul.empty();

        $(dictionaries.reverse()).each(function (i, dictionary) {
            ul.append($("<li></li>").text(dictionary.trFrom + "-" + dictionary.trTo).attr("data-langId", dictionary.id));
        });
    }

    app.currentWord = null;
    /**
     * Initialize events on page
     */
    app.setupViewEvents = function () {
        var fHideAllViews, displayHomeScene;

        displayHomeScene = function () {
            fHideAllViews();
            $("#view-select-language").show();
            $("#description").show();
            $("#return-button").hide();
            breadCrumb.clear().addPath({label:'Home', viewToDisplay:'select-language'}).render();
        };

        breadCrumb.addPath({label:'Home', viewToDisplay:'select-language'}).render();

        fHideAllViews = function () {
            $(".jqs-view").hide();
        };

        /**
         * Choose language
         */
        $("#view-select-language").on("click", "li", function () {
            var container1, container2, currentLang, crumb;

            fHideAllViews();
            $("#return-button").show();
            $("#description_choices").show();
            $("#view-game-mode").show();
            currentLangId = $(this).attr('data-langId');
            currentLang = dictionaryFinder.findById(currentLangId);
            crumb = {
                label:currentLang.trFrom + '-' + currentLang.trTo,
                viewToDisplay:'game-mode'
            };
            breadCrumb.addPath(crumb).render();

        });

        $("#return-button").click(displayHomeScene);

        /**
         * Add new language button
         */
        $("#new_dictionary").click(function () {
            breadCrumb.addPath({label:'Add new language'}).render();
            $("#add_new_dictionary").show();
            $("#return-button").show();
            $("#description").hide();
            $("#description_of_add_dictionary").show();
            $("#view-select-language").hide();
            $("#return-button").click(function () {
                fHideAllViews();
                $("#view-select-language").show();
            });
        });

        /**
         * Add new word button
         */
        $("#new_word").click(function () {
            fHideAllViews();
            $("#view-add-new").show();
            $("#description_of_add_word").show();
            breadCrumb.addPath({label:'Add new word'}).render();
        });

        /**
         * Start game
         */
        $("#game").click(function () {
            fHideAllViews();
            $("#view-game").show();
            $("#description_of_game").show();

            /**
             * Display statistic
             */
            $("div#statistic").show();

            container1 = wordFinder.findAll(wordStorage.getWords(), currentLangId);
            $("div#statistic ul li:nth-child(1)").text("All words, you entered : " + container1.length);
            container2 = wordFinder.findAllToDisplayToday(wordStorage.getWords(), currentLangId, new Date());
            $("div#statistic ul li:nth-child(2)").text("Words for today: " + container2.length);
            $(".bar").css("width", (100 * container2.length) / container1.length + "%")

            breadCrumb.addPath({label:'Game'}).render();
        });
    };

    /**
     * Handle save new word action
     */
    app.defineSaveAction = function () {
        $("#save").click(function () {
            var word, source, destination, words, isValid = true;

            source = $("div#foreign_word textarea").val();
            destination = $("div#translate_word textarea").val();

            $(".foreign, .translate").each(function (i, elem) {
                var $elem = $(elem),
                    val = $.trim($elem.val());


                if (val.length === 0) {
                    isValid = false;
                    $elem.parent('div').addClass("error");
                    $elem.addClass("inputError");
                    $elem.next('.help-inline').show().text("Please enter the value");
                    $(".alert.alert-info").hide();
                } else {
                    $elem.removeClass("inputError");
                    $elem.parent('div').removeClass("error");
                    $elem.next('.help-inline').hide()
                }
            });

            /**
             * create new object with new word
             */

            if (isValid) {
                $(".alert.alert-info").show();
                word = new Word(source, destination, 0, currentLangId);
                word.displayDate = displayDataFinder.findDate(progressPattern, word.step);
                wordStorage.addWord(word);

                $("div#foreign_word textarea").val("");
                $("div#translate_word textarea").val("");
            }
        });


        /**
         * Save new dictionary
         */
        $("#save_new_dictionary").click(function () {
            var $trFrom = $("#jq-from"), $trTo = $("#jq-to"), dictionary, langId, isValid = true;

            $.each([$trFrom, $trTo ], function (i, $elem) {
                var val = $.trim($elem.val());

                if (val.length === 0) {
                    isValid = false;
                    $elem.parent('div').addClass("error");
                    $elem.addClass("inputError");
                    $elem.next('.help-inline').show().text("Field cannot be empty");
                } else {
                    $elem.removeClass("inputError");
                    $elem.parent('div').removeClass("error");
                    $elem.next('.help-inline').hide()
                }
            });

            if (isValid) {
                langId = (new Date().getTime());

                /**
                 * Create new dictionary object
                 */
                dictionary = new Dictionary(langId, $trFrom.val(), $trTo.val());
                dictionaryStorage.addNewDictionary(dictionary);

                $trFrom.val("");
                $trTo.val("");

                breadCrumb.revertTo(0);

                $(".jqs-view").hide();
                $("#view-select-language").show();
                $("#return-button").hide();
                $("#description").show();

                app.listDictionaries();
            }
        });


    };

    /**
     * Display current word
     */
    app.displayCurrentWord = function () {
        var word = this.currentWord,
            sc = $('#window_with_random_word'); //sourceContainer

        if (word !== null) {
            sc.text(word.source);
        } else { //lack of words, bide action buttons
            sc.text('Lack of words to display today');
            $('#check, #solve, #solve_not').hide();
        }
        $('#translate p').text('');

    };
    /**
     * Find new current word
     */
    app.findNewCurrentWord = function () {
        var words = wordStorage.getWords();

        this.currentWord = wordFinder.find(words, currentLangId, new Date());
    };
    /**
     * Handle game action
     */
    app.defineGameActions = function () {
        var that = this, fReset;

        /**
         * Reset game state
         */
        fReset = function () {
            that.findNewCurrentWord();
            that.displayCurrentWord();
        };

        $("#game").click(function () {
            $('#check').show();
            $("#solve, #solve_not").hide();
            that.findNewCurrentWord();
            that.displayCurrentWord();
        });

        /**
         * Handle check action
         */
        $("#check").click(function () {
            $('#translate p').text(that.currentWord.destination);
            $("#check").hide();
            $("#solve, #solve_not").show();
        });

        /**
         * If user doesn't guess word, the step of the word will be reset
         */
        $("#solve_not").click(function () {
            $("#solve_not, #solve").hide();

            var word = that.currentWord;

            wordStorage.removeWord(word);
            word.step = 0;
            word.displayDate = displayDataFinder.findDate(progressPattern, word.step);
            wordStorage.addWord(word);

            fReset();
            $("#check").show();
        });

        /**
         * If user guess word, the step of the word will be increased
         */
        $("#solve").click(function () {
            $("#solve, #solve_not").hide();
            $("#check").show();
            var word = that.currentWord;

            wordStorage.removeWord(word);
            word.step++;
            word.displayDate = displayDataFinder.findDate(progressPattern, word.step);
            if (word.displayDate !== -1) {
                wordStorage.addWord(word);
            }

            fReset();
        });
    };

    if (Modernizr.localstorage === false) {
        $(".alert.alert-error").show();
        $("#new_dictionary").hide();
    } else {
        app.listDictionaries();
        app.setupViewEvents();
        app.defineSaveAction();
        app.defineGameActions();
    }

})
;
