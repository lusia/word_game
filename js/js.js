$(document).ready(function () {
    var app = {}, Word, config = {langId:null},
        displayDataFinder, wordStorage,
        progressPattern = [1, 1, 2, 3, 5, 7, 9, 11, 18];

    Word = function (source, destination, step, langId) {
        this.id = (new Date()).getTime();
        this.source = source; // word to translate
        this.destination = destination; // translation of the word
        this.displayDate = null;
        this.step = step;
        this.langId = langId;
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
         * @param words array
         * @param langId int
         * @param date date
         *
         * @return Word|null
         */
        find:function (words, langId, date) {
            var i, word, displayDate, out = null;

            for (i = 0; i < words.length; i++) {
                word = words[i];
                displayDate = new Date(word.displayDate);
                if ((displayDate.getTime() <= date.getTime()) && (word.langId === langId)) {
                    out = word;
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
         * Display statistic
         */
        $("div#statistic ul li:first").append(localStorage);

        /**
         * Choose language
         */
        $("div#view-select-language ul li").click(function () {
            fHideAllViews();
            config.langId = $(this).attr('data-langId');
            $("#view-game-mode").show();
        });

        $("#return-button").click(function () {
            fHideAllViews();
            $("#view-select-language").show();
        });

        /**
         * Add new language button
         */

        $("#new_language").click(function () {
            var value = 2,
                newLanguage = prompt("Please enter new language");

            if ((newLanguage !== "") && (newLanguage.indexOf("-") !== -1)){ //&& (typeof newLanguage !== number)) {
                $("div#view-select-language ul").append("<li>" + newLanguage + "</li>").attr('data-langId', value++);
                console.log($("div#view-select-language ul").attr('data-langId'));
            }
            else {
                alert("Please check if you you enter the new language");
            }

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
            word = new Word(source, destination, 0, config.langId);
            word.displayDate = displayDataFinder.findDate(progressPattern, word.step);
            wordStorage.addWord(word);

            $("div#foreign_word textarea").val("");
            $("div#translate_word textarea").val("");
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
     * Display current word
     */
    app.findNewCurrentWord = function () {
        var words = wordStorage.getWords();

        this.currentWord = wordFinder.find(words, config.langId, new Date());
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

    app.setupViewEvents();
    app.defineSaveAction();
    app.defineGameActions();
});
