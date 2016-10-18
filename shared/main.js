Meteor.methods({
    addComment: function (comment) {

        if (this.userId) { // we have a user
            comment.owner = this.userId;
            comment.createdOn = new Date;
            console.log('comment:', comment);
            return Comments.insert(comment);
        }

        return;
    },
    addEditingUser: function (docid) {
        var doc, user, eUsers;
        doc = Documents.findOne({_id: docid});
        if (!doc) {
            return; // no doc available
        }

        if (!this.userId) {
            return; // no logged in user
        }

        user = Meteor.user().profile;

        // console.log('Meteor.user()._id', Meteor.user()._id);
        // console.log('this.userId', this.userId);
        // console.log('Meteor.userId()', Meteor.userId());

        eUsers = EditingUsers.findOne({docid: doc._id});

        if (!eUsers) {
            eUsers = {
                docid: doc._id,
                users: {}
            };
        }
        user.lastEdit = new Date();
        eUsers.users[this.userId] = user;

        EditingUsers.upsert({_id: eUsers._id}, eUsers);
    },
    addDoc: function() {
        var doc, id;
        if (!this.userId) { // not logged in
            return;
        } else {
            doc = {
                owner: this.userId,
                created: new Date(),
                title: 'My new doc'
            };

            id = Documents.insert(doc);
            console.log('addDoc method: inserted new doc ' + id);
            return id;
        }
    },
    updateDocPrivacy: function (doc) {
        var realDoc = Documents.findOne({_id: doc._id, owner: this.userId});

        if (realDoc) {
            realDoc.isPrivate = doc.isPrivate;
            Documents.update({_id: doc._id}, realDoc);
        }

    }
});
