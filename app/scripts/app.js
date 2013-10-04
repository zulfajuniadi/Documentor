var Documents = new Sarah.Collection('Documents', {
    plugins: {
        localstorage: {
            name: 'Documents'
        }
    },
    softDelete : false
});

var Settings = Utils.Store.get('settings') || {};

Deps.register('watchSettings', function(){
    return Settings;
}, function(settings){
    Utils.Store.set('settings', settings);
});

$.fn.switchClass = function(classA, classB) {
    if(this.hasClass(classA)) {
        this.removeClass(classA);
        this.addClass(classB);
    } else {
        this.removeClass(classB);
        this.addClass(classA);
    }
}

// bootbox.animate(false);

var tokens = marked.lexer('text', {});

marked.setOptions({
    gfm: true,
    highlight: function(code, lang, callback) {
        if (typeof lang !== 'undefined')
            return hljs.highlight(lang, code).value;
        return hljs.highlightAuto(code).value || code;
    },
    tables: true,
    breaks: true,
    pedantic: false,
    sanitize: true,
    smartLists: true,
    smartypants: false,
    langPrefix: 'lang-'
});

Handlebars.registerHelper('mdlink', function(str){
    return new String(str).toLowerCase().replace(/\s/g,'-');
});

Handlebars.registerHelper('html2md', function(data) {
    return marked(data);
});

Handlebars.registerHelper('decodeEntities', function(str) {
    // this prevents any overhead from creating the object each time
    var element = document.createElement('div');
    if (str && typeof str === 'string') {
        // strip script/html tags
        str = str.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '');
        str = str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '');
        element.innerHTML = str;
        str = element.textContent;
        element.textContent = '';
    }
    return str;
});

function download(filename, text) {
    var pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    pom.setAttribute('download', filename);
    pom.click();
}

Router.get('/home', 'home', function() {
    // Session.set('zenMode', null);
    $('body').removeClass('zenMode');

    Template.app.events({
        'click #newDoc': function() {
            var pageId = Utils.genId();
            var doc = Documents.insert({
                title: 'New Document',
                pages: [{
                    _id: pageId,
                    title: 'New Page',
                    contents: "#New Page\n---\n",
                    createdAt: new Date(),
                    updatedAt: new Date()
                }]
            });
            Router.to('/edit/' + doc._id + '/' + pageId);
        },
        'keyup #searchBox' : function(e) {
            var target = $(e.currentTarget);
            Session.set('search', target.val());
        },
        'click #settingsBtn' : function(){
            Modal.show({
                template : 'modal__settings',
                data : Settings,
                title : 'Settings'
            });
            $('#getDir').click(function(e){
                $('#filePickerInput').focus().click();
            });
            $('#filePickerInput').on('change', function(){
                $('#defaultDir').val($(this).val())
            })
        }
    });

    Template.docs.attributes({
        'documents': function() {
            var search = Session.get('search');
            if(!search) {
                return Documents.getAll();
            }
            try {
                var rg = new RegExp(search,'gi');
                var result = Documents.getAll().filter(function(doc){
                    if(rg.test(doc.title)) {
                        return true;
                    } else {
                        var pages = doc.pages.filter(function(page){
                            if(rg.test(page.title)) {
                                return true;
                            }
                            return rg.test(page.contents);
                        }).length;

                        if(pages > 0)
                            return true;
                    }
                    return false;

                });
                return result;
            } catch (e) {
                return [];
            }
        },
        search : function() {
            return Session.get('search');
        }
    });

    Template.app.partials([{
        template: Template.docs,
        outlet: '.docs'
    }]);

    Template.app.setOutlet('#outlet');
    Template.app.afterRender = function(){
        var input = $('#searchBox');
        input.focus().val(input.val());
    }
});

/*Router.get('/view/:id', 'viewDoc', function(routeData) {
    var doc = Documents.get(routeData.params.id);
});*/

Router.get('/view/:id/:pageId', 'view', function(routeData) {
    // Session.set('zenMode', null);
    $('body').removeClass('zenMode');

    var doc = Documents.get(routeData.params.id);
    var page = _.findWhere(doc.pages, {
        _id: routeData.params.pageId
    });

    Template.view.attributes({
        document: function() {
            return doc;
        },
        page: function() {
            return page;
        }
    });
    Template.view.events({
        'mouseover .panel-opener' : function() {
            if(Session.equals('panelOpen', undefined)) {
                $('.panel').addClass('open');
            }
        },
        'mouseleave .panel' : function(){
            if(Session.equals('panelOpen', undefined)) {
                $('.panel').removeClass('open');
            }
        },
        'click .lock' : function(){
            var panel = $('.panel');
            if(Session.equals('panelOpen', true)) {
                panel.removeClass('open');
                Session.set('panelOpen', null);
                $('.wrapper').css({'padding-left': '70px'})
            } else {
                panel.addClass('open');
                Session.set('panelOpen', true);
                $('.wrapper').css({'padding-left': '280px'})
            }
            panel.find('i.lockIcon').switchClass('icon-unlock', 'icon-lock');
        },
        'click .tocBtn' : function(){
            var toc = $('#toc');
            toc.toggleClass('open');
            if(toc.is('.open')) {
                Session.set('tocOpen', true);
            } else {
                Session.set('tocOpen', null);
            }
        },
        'click .scrollTo' : function(e) {
            var target = $(e.currentTarget);
            $('body').animate({scrollTop: $('#' + target.data('to')).position().top }, '500');
        },
        'click #newPage': function() {
            var pageId = Utils.genId();
            doc.pages.push({
                _id: pageId,
                title: 'New Page',
                contents: "#New Page\n---\n",
                createdAt: new Date(),
                updatedAt: new Date()
            });
            Documents.update({
                _id: doc._id
            }, doc);
            $.bootstrapGrowl('"New Page" Created.', 'success', {
                bottom: '0px'
            });
            Router.to('/edit/' + doc._id + '/' + pageId);
        },
        'click #goHome': function() {
            Router.to('/home');
        },
        'click #editPage': function() {
            Router.to('/edit/' + doc._id + '/' + page._id);
        }
    })
    Template.view.beforeRender = function() {
        // $('html,body').css({'background-color' : '#fff'});
    }
    Template.view.afterRender = function() {
        if(Session.equals('panelOpen', true)) {
            $('.wrapper').css({'padding-left':'280px'})
        }
        $('.previewWrapper').html(marked(page.contents));
    }
    Template.view.setOutlet('#outlet');
});

Router.get('/edit/:id', 'newPage', function(routeData) {
    var doc = Documents.get(routeData.params.id);
    doc.pages = doc.pages || [];
    if(doc.pages.length === 0) {
        doc.pages = [{
            _id: Utils.genId(),
            title: 'New Page',
            contents: "#New Page\n---\n",
            createdAt: new Date(),
            updatedAt: new Date()
        }];
        Documents.update({_id : doc._id}, doc);
    }
    Router.to('/edit/'+ doc._id + '/' + doc.pages[0]._id);
});

Router.get('/edit/:id/:pageId', 'edit', function(routeData) {

    var doc = Documents.get(routeData.params.id);
    var page = _.findWhere(doc.pages, {
        _id: routeData.params.pageId
    });
    var to;

    Template.edit.attributes({
        document: function() {
            return doc;
        },
        page: function() {
            return page;
        }
    });

    /* Keyboard shortcuts */

    Mousetrap.bind('mod+s', function(e){
        e.preventDefault();
        if(Utils.isFunction(savePage)) {
            savePage();
        } else {
            console.log('not fn')
        }
        return false;
    });

    Mousetrap.bind('mod+r', function(e){
        e.preventDefault();
        return false;
    });

    function setUnsaved() {
        Router.onExit(function(callback) {
            savePage();
            return true;
        });
    }

    function updatePreview(length) {
        $('#preview').html(marked($('.pageContents').val()));
        $('#preview code').click(function(e) {
            e.preventDefault();
            var target = $(e.currentTarget);
            var range = document.createRange();
            range.selectNode(target[0]);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
        });
        if (length) {
            setTimeout(function() {
                var caret = Session.get('caret');
                var begin = 0;
                var end = 0;
                if (typeof caret.caret.begin !== 'undefined') {
                    begin = caret.caret.end + length;
                    end = caret.caret.end + length;
                }
                $('.pageContents').caret(begin, end);
            }, 10);
        }
    }

    function savePage() {
        page.contents = $('.pageContents').val();
        page.updatedAt = new Date();
        var headings = (page.contents.match(/(^[\#]{1,2}.*)|(\n[\#]{1,2}.*)/ig) || []).map(function(match) {
            if(match.indexOf('###') > -1) {
                return {
                    type : 3,
                    heading : match.replace(/\#/g, '').trim()
                }
            } else if(match.indexOf('##') > -1) {
                return {
                    type : 2,
                    heading : match.replace(/\#/g, '').trim()
                }
            } else if(match.indexOf('#') > -1) {
                return {
                    type : 1,
                    heading : match.replace(/\#/g, '').trim()
                }
            }
        });
        if (headings.length > 0) {
            page.title = headings.shift().heading;
            page.headings = headings;
        } else {
            page.title = 'New Page';
        }
        Documents.update({
            _id: doc._id
        }, doc);
        $.bootstrapGrowl('Page saved');
        Router.onExit(function(callback) {
            if(Utils.isFunction(callback)) {
                return callback();
            } else {
                return true;
            }
        });
    }

    function setBold() {
        $('.pageContents').insertAtCaret("__", "__");
        updatePreview(2);
        setUnsaved();
    }

    function setItalic() {
        $('.pageContents').insertAtCaret("_", "_");
        updatePreview(2);
        setUnsaved();
    }

    function setCodeInline() {
        $('.pageContents').insertAtCaret("```", "```");
        updatePreview(2);
        setUnsaved();
    }

    Template.edit.events({
        'mouseover .panel-opener' : function() {
            if(Session.equals('panelOpen', undefined)) {
                $('.panel').addClass('open');
            }
        },
        'mouseleave .panel' : function(){
            if(Session.equals('panelOpen', undefined)) {
                $('.panel').removeClass('open');
            }
        },
        'click .zM' : function(){
            if(Session.equals('zenMode', true)) {
                $('body').removeClass('zenMode');
                Session.set('zenMode', null);
                $('.pageContents').trigger('autosize.destroy');
                setTimeout(function(){
                    $('.pageContents').autosize();
                },10);
            } else {
                $('body').addClass('zenMode');
                Session.set('zenMode', true);
            }
        },
        'click .lock' : function(){
            var panel = $('.panel');
            if(Session.equals('panelOpen', true)) {
                panel.removeClass('open');
                Session.set('panelOpen', null);
                $('.wrapper').css({'padding-left': '70px'})
            } else {
                panel.addClass('open');
                Session.set('panelOpen', true);
                $('.wrapper').css({'padding-left': '280px'})
            }
            panel.find('i.lockIcon').switchClass('icon-unlock', 'icon-lock');
        },
        'mouseover .doctitle': function(e) {
            var target = $(e.currentTarget);
            target.addClass('show');
        },
        'mouseout .doctitle': function(e) {
            var target = $(e.currentTarget);
            target.removeClass('show');
        },
        'click #editDocumentName': function() {
            bootbox.prompt('Rename Document : ', function(result) {
                if (result !== '' && result !== null) {
                    doc.title = result;
                    Documents.update({
                        _id: doc._id
                    }, doc);
                }
            })
        },
        'click #removeDocument': function(event) {
            bootbox.confirm('Are you sure you want to remove this Document?', function(result){
                if(result) {
                    Documents.remove({
                        _id: doc._id
                    });
                    Router.to('/home');
                } else {
                    event.preventDefault();
                }
            });
        },
        'click #newPage': function() {
            var pageId = Utils.genId();
            doc.pages.push({
                _id: pageId,
                title: 'New Page',
                contents: "#New Page\n---\n",
                createdAt: new Date(),
                updatedAt: new Date()
            });
            Documents.update({
                _id: doc._id
            }, doc);
            $.bootstrapGrowl('"New Page" Created.', 'success', {
                bottom: '0px'
            })
        },
        'keydown .pageContents': function(e) {
            var defaultPrevented = false;
            if(e.metaKey || e.ctrlKey) {
                switch (e.keyCode) {
                    case 83 : // save
                        savePage();
                        setTimeout(function(){
                            var caret = Session.get('caret');
                            $('.pageContents').caret(caret.caret.begin, caret.caret.end);
                        }, 200);
                    case 82 : // reload
                        defaultPrevented = true;
                        break;
                    case 66 : // bold
                        setBold();
                        defaultPrevented = true;
                        break;
                    case 73 : // italic
                        setItalic();
                        defaultPrevented = true;
                        break;
                    case 68 : // ctrl + d
                        setCodeInline();
                        defaultPrevented = true;
                        break;
                    default:
                        // console.log(e.keyCode);
                }
            }
            if(defaultPrevented) {
                e.preventDefault();
                return false;
            }
        },
        'keyup .pageContents': function(e) {
            updatePreview();
            Session.set('caret', {
                _id: page._id,
                caret: $('.pageContents').caret()
            });
            setUnsaved();
        },
        'click #savePage': savePage,
        'click #removePage': function(e) {
            var id = e.data.page._id;
            var prop = Documents.getProperties('_id', id);
            bootbox.confirm('Are you sure you want to delete this page?', function(result) {
                if (result) {
                    prop.collection.pages = prop.collection.pages.filter(function(page) {
                        return page._id !== id;
                    });
                    Documents.update({
                        _id: prop.collection._id
                    }, prop.collection);
                    Router.to('/edit/' + prop.collection._id);
                    $.bootstrapGrowl('Page deleted');
                }
            });
        },
        'focus .pageContents': function(e) {
            Session.set('caret', {
                _id: page._id,
                caret: $('.pageContents').caret()
            });
        },
        'click .pageContents': function(e) {
            Session.set('caret', {
                _id: page._id,
                caret: $('.pageContents').caret()
            });
        },
        'click #setH1': function(e) {
            $('.pageContents').insertAtCaret("#");
            updatePreview(2);
            setUnsaved();
        },
        'click #setH2': function(e) {
            $('.pageContents').insertAtCaret("##");
            updatePreview(3);
            setUnsaved();
        },
        'click #setH3': function(e) {
            $('.pageContents').insertAtCaret("###");
            updatePreview(4);
            setUnsaved();
        },
        'click #setBold': setBold,
        'click #setItalic': setItalic,
        'click #setStrike': function(e) {
            $('.pageContents').insertAtCaret("~~", "~~");
            updatePreview(2);
            setUnsaved();
        },
        'click #setCode': function(e) {
            $('.pageContents').insertAtCaret("```\n", "\n```");
            updatePreview(2);
            setUnsaved();
        },
        'click #setCodeInline': setCodeInline,
        'click #setUL': function(e) {
            $('.pageContents').insertAtCaret("* ");
            updatePreview(2);
            setUnsaved();
        },
        'click #setOL': function(e) {
            $('.pageContents').insertAtCaret("1. ");
            updatePreview(4);
            setUnsaved();
        },
        'click #setBQ': function(e) {
            $('.pageContents').insertAtCaret("\n> ");
            updatePreview(2);
            setUnsaved();
        },
        'click #setHR': function(e) {
            $('.pageContents').insertAtCaret("\n***\n");
            updatePreview(4);
            setUnsaved();
        },
        'click #setLink': function() {
            bootbox.dialog('<form><input class="input-block-level" id="linkText" placeholder="Link Text" autocomplete="off" type="text" value=""><input class="input-block-level" id="linkUrl" placeholder="Link URL" autocomplete="off" type="text" value=""></form>', [{
                "label": "Cancel",
                "callback": function() {
                    $('.bootbox.modal').modal('hide');
                }
            }, {
                "label": "Insert",
                "callback": function() {
                    var url = $('#linkUrl').val();
                    if (url.match(/http:\/\//) === null) {
                        url = 'http://' + url;
                    }
                    $('.pageContents').insertAtCaret("[" + $('#linkText').val() + "](" + url + ")");
                    updatePreview(2);
                }
            }])
        },
        'click #setImg': function() {
            bootbox.dialog('<form><input class="input-block-level" id="imgText" placeholder="Image Alt Text" autocomplete="off" type="text" value=""><input class="input-block-level" id="imgUrl" placeholder="Image URL" autocomplete="off" type="text" value=""></form>', [{
                "label": "Cancel",
                "callback": function() {
                    $('.bootbox.modal').modal('hide');
                }
            }, {
                "label": "Insert",
                "callback": function() {
                    var url = $('#imgUrl').val();
                    if (url.match(/http:\/\//) === null) {
                        url = 'http://' + url;
                    }
                    $('.pageContents').insertAtCaret("![" + $('#imgText').val() + "](" + url + ")");
                    updatePreview(2);
                }
            }])
        },
        'click #downloadPage': function() {
            download(page.title + '.md', $('.pageContents').val());
        },
        'click #viewPage': function() {
            Router.to('/view/' + doc._id + '/' + page._id);
        },
        'click #goHome': function() {
            Router.to('/home');
        }
    });
    Template.edit.beforeRender = function(){
        Session.set('scrollTop', $('body').scrollTop());
        // $('html,body').css({'background-color' : '#fff'});
    }
    Template.edit.afterRender = function() {
        if(Session.equals('panelOpen', true)) {
            $('.wrapper').css({'padding-left':'280px'})
        }
        if(Session.equals('zenMode', true)) {
            $('body').addClass('zenMode');
        } else {
            $('body').removeClass('zenMode');
        }
        tabIndent.renderAll();
        var target = $('.pageContents');
        $('#preview').html(marked(target.val()));
        target.autosize();
        setTimeout(function(){
            target.trigger('autosize.resize');
        },10);

        /* Highlight preview code */
        $('#preview code').click(function(e) {
            e.preventDefault();
            var target = $(e.currentTarget);
            var range = document.createRange();
            range.selectNode(target[0]);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
        });

        $('body').scrollTop(Session.get('scrollTop'));
    };
    Template.edit.setOutlet('#outlet');
});


Router.run(function() {
    Router.to('/home');
});