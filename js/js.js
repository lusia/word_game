$(document).ready(function () {
    var app = {}, Word, currentLangId,
        displayDataFinder, wordStorage, dictionaryStorage,
        progressPattern = [1, 1, 2, 3, 5, 7, 9, 11, 18];

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
        this.trFrom = trFrom; //translation from which language
        this.trTo = trTo; //translation to which language
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
         * Find all words to display in actual date
         * @param words
         * @param langId
         * @param date
         *
         * @return {Array}
         */
        findAllToDisplayToday:function (words, langId, date) {
            var i, word, displayDate, out = [];

            for (i = 0; i < words.length; i++) {
                word = words[i];
                displayDate = new Date(word.displayDate);
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
    /**
     * Get dictionary from the localStorage
     */
    app.listDictionaries = function () {
        var dictionaries = dictionaryStorage.getDictionaries(), i,
            ul = $("div#view-select-language ul");
        console.log(dictionaries);
        ul.empty();

        $(dictionaries).each(function (i, dictionary) {
            ul.append($("<li></li>").text(dictionary.trFrom + "-" + dictionary.trTo).attr("data-langId", dictionary.id));
            ul.append($("<li></li>").text(this.trFrom + "-" + this.trTo).attr("data-langId", this.id));
        });
//        for (i = 0; i < dictionaries.length; i++) {
//            ul.append($("<li></li>").text(dictionaries[i].trFrom + "-" + dictionaries[i].trTo).attr("data-langId", dictionaries[i].id));
//        }
    }

    app.currentWord = null;
    /**
     * Initialize events on page
     */
    app.setupViewEvents = function () {
        var fHideAllViews;

        fHideAllViews = function () {
            $(".jqs-view").hide();
        };

        /**
         * Choose language
         */
        $("#view-select-language").on("click", "li", function () {
            var container;

            fHideAllViews();

            currentLangId = $(this).attr('data-langId');
            $("#view-game-mode").show();

            /**
             * Display statistic
             */

            $("div#statistic").show();
            container = wordFinder.findAll(wordStorage.getWords(), currentLangId);
            $("div#statistic ul li:nth-child(1)").text("All words, you entered : " + container.length);
            container = wordFinder.findAllToDisplayToday(wordStorage.getWords(), currentLangId, new Date());
            $("div#statistic ul li:nth-child(2)").text("Words for today: " + container.length);
        });

        $("#return-button").click(function () {
            fHideAllViews();
            $("#view-select-language").show();
        });

        /**
         * Add new language button
         */

        $("#new_dictionary").click(function () {
            $("#add_new_dictionary").show();
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
        });

        /**
         * Start game
         */
        $("#game").click(function () {
            fHideAllViews();
            $("#view-game").show();
        });
    };

    /**
     * Handle save new word action
     */
    app.defineSaveAction = function () {
        $("#save").click(function () {
            var word, source, destination, words;

            source = $("div#foreign_word textarea").val();
            destination = $("div#translate_word textarea").val();
            /**
             * create new object with new word
             */
            word = new Word(source, destination, 0, currentLangId);
            word.displayDate = displayDataFinder.findDate(progressPattern, word.step);
            wordStorage.addWord(word);

            $("div#foreign_word textarea").val("");
            $("div#translate_word textarea").val("");
        });


        /**
         * Save new dictionary
         */
        $("#save_new_dictionary").click(function () {
            var trFrom, trTo, dictionary, langId;

            $(".jqs-view").hide();
            $("#view-select-language").show();

            trFrom = $("#jq-from").val();
            trTo = $("#jq-to").val();
            langId = (new Date().getTime());

            /**
             * Create new dictionary object
             */
            dictionary = new Dictionary(langId, trFrom, trTo);
            dictionaryStorage.addNewDictionary(dictionary);

            app.listDictionaries();
            $("#jq-from").val("");
            $("#jq-to").val("");
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
            $('#check, #solve, #solve_not').show();
            that.findNewCurrentWord();
            that.displayCurrentWord();
        });

        /**
         * Handle check action
         */
        $("#check").click(function () {
            $('#translate p').text(that.currentWord.destination);
        });

        /**
         * If user doesn't guess word, the step of the word will be reset
         */
        $("#solve_not").click(function () {
            var word = that.currentWord;

            wordStorage.removeWord(word);
            word.step = 0;
            word.displayDate = displayDataFinder.findDate(progressPattern, word.step);
            wordStorage.addWord(word);

            fReset();
        });

        /**
         * If user guess word, the step of the word will be increased
         */
        $("#solve").click(function () {
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

    app.listDictionaries();
    app.setupViewEvents();
    app.defineSaveAction();
    app.defineGameActions();
});
