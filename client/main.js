Meteor.subscribe('documents');
Meteor.subscribe('editingUsers');
Meteor.subscribe('comments');

Router.configure({
    layoutTemplate: 'ApplicationLayout'
});

Router.route('/', function() {
    console.log('you hit /');
    this.render('navbar', { to: 'header' });
    this.render('docList', { to: 'main' });
});

Router.route('/documents/:_id', function() {
    console.log('you hit /documents/' + this.params._id );
    Session.set('docId', this.params._id);
    this.render('navbar', { to: 'header' });
    this.render('docItem', { to: 'main' });
});

Template.editor.helpers({
    docid: function() {
        setupCurrentDocument();
        return Session.get('docId');
    },
    config: function() {
        return function(editor) {
            editor.setOption('lineNumbers', true);
            editor.setOption('theme', 'icecoder');
            editor.on('change', function(cm_editor, info) {
                $('#viewer_iframe').contents().find('html').html(cm_editor.getValue());
                Meteor.call('addEditingUser', Session.get('docId'));
            });
        };
    }
});

Template.editingUsers.helpers({
    users: function() {
        var doc,
            eUsers,
            users = [];
        doc = Documents.findOne({ _id: Session.get('docId') });

        if (!doc) {
            return; // no doc available
        }

        eUsers = EditingUsers.findOne({
            docid: doc._id
        });

        if (!eUsers) {
            return; // no editing users
        }

        for (var user_id in eUsers.users) {
            users.push(fixObjectKeys(eUsers.users[user_id]));
        }

        return users;
    }
});

Template.navbar.helpers({
    documents: function() {
        return Documents.find();
    }
});

Template.docMeta.helpers({
    document: function() {
        return Documents.findOne({
            _id: Session.get('docId')
        });
    },
    canEdit: function() {
        var doc;
        doc = Documents.findOne({
            _id: Session.get('docId')
        });
        return (doc && doc.owner === Meteor.userId());
    }
});

Template.editableText.helpers({
    userCanEdit: function(doc, collection) {
        // can edit if the current doc is owned by me
        doc = Documents.findOne({
            _id: Session.get('docId'),
            owner: Meteor.userId()
        });

        if (doc) {
            return true;
        } else {
            return false;
        }
    }
});

Template.docList.helpers({
    documents: function () {
        return Documents.find();
    }
});

Template.insertCommentForm.helpers({
    docId: function () {
        return Session.get('docId');
    }
});

Template.commentList.helpers({
    comments: function () {
        return Comments.find({ docId: Session.get('docId') });
    }
});

////////
/// EVENTS
///////

Template.navbar.events({
    'click .js-add-doc': function(event) {
        event.preventDefault();
        console.log('adding a new doc!');
        if (!Meteor.user()) {
            alert('please login first!');
        } else {
            Meteor.call('addDoc', function(err, res) {
                if (!err) {
                    Session.set('docId', res);
                }
            });
        }
    }
});

Template.docMeta.events({
    'click .js-tog-privacy': function(event) {
        var doc = {
            _id: Session.get('docId'),
            isPrivate: event.target.checked
        };

        Meteor.call('updateDocPrivacy', doc);
    }
});

function fixObjectKeys(obj) {
    var newObj = {};
    for (key in obj) {
        var key2 = key.replace(/\-/g, '');
        newObj[key2] = obj[key];
    }
    return newObj;
}

function setupCurrentDocument() {
    var doc;
    if (!Session.get('docId')) { // no docId set yet
        doc = Documents.findOne();
        if (doc) {
            Session.set('docId', doc._id);
        }
    }
}
