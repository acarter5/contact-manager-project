


/* helper functions*/

function isEmpty( el ){
  return !$.trim(el.html())
}

function contactRendered(id) {
  var $contacts = $contactsContainer.find('input[type=hidden]'),
      rendered = false;

  $contacts.each(function(){
    debugger;
    var $contactIdentifier = $(this);
    if (Number($contactIdentifier.val()) === id) {
      rendered = true;
      return;
    }
  });

  return rendered;
};

/* Contact Constuctor*/

function Contact(name, email, phone, tags, id) {
  this.name = name || '';
  this.email = email || '';
  this.phone = phone || ''; 
  this.tags = tags || [];
  this.id = id;
}

/* Contact Collection Constructor*/

function ContactsObject() {
  this.collection = [];
  this.lastId = 0;
  this.curContact = '';
}

ContactsObject.prototype = {
  makeContact: function() {
    var contact = new Contact('', '', '', [], this.lastId);
    this.lastId++;
    this.collection.push(contact);
    return contact;
  },
  remove: function(id) {
    var idx;

    this.collection.forEach(function(contact, index) {
      if (contact.id === id) {
        idx = index;
      }
    });

    this.collection.splice(idx, 1);
  },
  get: function(id) {
    return this.collection.filter(function(contact) {
      return  contact.id === id;
    }).pop();
  }, 
}

/* UI Methods*/ 
var UI = {
  displayContacts: function(contacts) {
    $contactsContainer.html('');

    contacts.forEach(function(contact) { 
      contactObjArray = contact.tags.map(function(tagName) {
        return {tag: tagName}
      });

      contact.tagObjs = contactObjArray;
      $contactsContainer.append(contactScript(contact));
    });
  },
  renderTagControl: function(tagName) {
    $tagsControlContainer.find('ul').append(tagsControlScript({tag: tagName}));
  },
  renderForm: function(contact) {
    $formContainer.find('input[name^=full-name]').val(contact.name);
    $formContainer.find('input[name^=email]').val(contact.email);
    $formContainer.find('input[name^=phone]').val(contact.phone),
    
    $('.form input[type=checkbox]').each(function() {
      var $checkbox = $(this);
      contact.tags.forEach(function(tag){
        if($checkbox.val() === tag) {
          $checkbox.prop('checked', true);
        }
      })
    });
  },
  showform: function() {
    $controlContainer.hide();
    $contactsContainer.hide();
    $noContactsDisplay.hide();
    $formContainer.show();
  },
  formDone: function() {
    document.getElementById('contact-form').reset();
    $formContainer.hide();
    $controlContainer.show();
    $contactsContainer.show();

    if (isEmpty($contactsContainer)) {
      $noContactsDisplay.show();
    }
  },
}

/* Manager Constructor*/

function Manager() {
  this.contacts = new ContactsObject;
  this.curContact = '';
  this.tagsCollection = [];
  this.init();
}

Manager.prototype = {
  processNewContact: function(event) {
    event.preventDefault();
    var contact = this.contacts.makeContact();
    this.curContact = contact;
    UI.showform();
  },
  cancelContact: function(event) {
    event.preventDefault();
    if (!(contactRendered(this.curContact.id))) {
      this.contacts.remove(this.curContact.id);
    }

    UI.formDone();
  },
  editContact: function(event) {
    event.preventDefault();
    var id = this.getId(event);
    this.curContact = this.contacts.get(id);
    UI.renderForm(this.curContact);
    UI.showform();
  },
  getId: function(event) {
    var $parent = $(event.target).closest('li');
    return Number($parent.find('input[type=hidden]').val()); 
  },
  deleteContact: function(event) {
    event.preventDefault();
    var id = this.getId(event);
    this.contacts.remove(id);
    UI.displayContacts(this.contacts.collection);

    if (isEmpty($contactsContainer)) {
      $noContactsDisplay.show();
    }
  },
  renderContact: function(event) {
    event.preventDefault();
    var contact = this.curContact;
        name = $formContainer.find('input[name^=full-name]').val(),
        email = $formContainer.find('input[name^=email]').val(),
        phone = $formContainer.find('input[name^=phone]').val(),
        tags = [],
        tagDOMElements = $('.form input[type=checkbox]:checked');

    tagDOMElements.each(function() {
      tags.push($(this).val());
    });

    contact.name = name;
    contact.email = email;
    contact.phone = phone;
    contact.tags = tags;

    UI.displayContacts(this.contacts.collection);
    UI.formDone();
  },
  filterContacts: function() {
    var query = new RegExp($searchInput.val(), 'i'),
        searchFilteredArray = [],
        tempArray = []
        tags = $controlContainer.find('input[type=checkbox]:checked');

    this.contacts.collection.forEach(function(contact) {
      if (contact.name.match(query)) {
        searchFilteredArray.push(contact);
      }
    });

    tags.each(function() {
      var controlTag = $(this).val();
      debugger;
      searchFilteredArray.forEach(function(contact) {
        if ($.inArray(controlTag, contact.tags) !== -1) {
          tempArray.push(contact);
        }
      });
      searchFilteredArray = tempArray;
      tempArray = [];
    });
    UI.displayContacts(searchFilteredArray);
  },
  processNewTag: function(event) {
    event.preventDefault();
    var tagName;
    if ($tagInput.val() !== '') {
      tagName = $tagInput.val();
      UI.renderTagControl(tagName);
      $tagInput.val('');
    }
    this.tagsCollection.push(tagName);
  },
  init: function() {
    this.registerDOMElements();
    this.bindEvents();
    this.registerTemplates();

    this.retrieveData();

    if (isEmpty($contactsContainer)) {
      $noContactsDisplay.show();
    }
  },
  registerDOMElements: function() {
    $controlContainer = $('.well');
    $formContainer = $('.form');
    $tagsControlContainer = $('.tags');
    $contactsContainer = $('#contacts-container');
    $noContactsDisplay = $('.no-contacts');
    $addContactBtn = $('.add-contact');
    $addTagBtn = $('.add-tag');
    $tagInput = $('.tag-input');
    $searchInput = $('.contact-name-search');
    $submitContactBtn = $('.submit-button');
    $cancelContactBtn = $('.cancel-button');
  },
  registerTemplates: function() {
    Handlebars.registerPartial('tagsPartial', $('#tags-to-render').html());
    contactContentScript = Handlebars.compile($('#contact-content').html());
    Handlebars.registerPartial('contactContentPartial', $('#contact-content').html());
    contactScript = Handlebars.compile($('#contact').html());

    tagsControlScript = Handlebars.compile($('#tags-control-template').html());
  },
  bindEvents: function() {
    $addContactBtn.on('click', this.processNewContact.bind(this));
    $addTagBtn.on('click', this.processNewTag.bind(this));
    $submitContactBtn.on('click', this.renderContact.bind(this));
    $cancelContactBtn.on('click', this.cancelContact.bind(this));
    $contactsContainer.on('click', '.edit-contact', this.editContact.bind(this));
    $contactsContainer.on('click', '.delete-contact', this.deleteContact.bind(this));
    $searchInput.on('input', this.filterContacts.bind(this));
    $controlContainer.on('change', 'input[type=checkbox]', this.filterContacts.bind(this));
    $(window).on('unload', this.storeData.bind(this));
  },
  storeData: function() {
    var collection = JSON.stringify(this.contacts.collection),
        tags = JSON.stringify(this.tagsCollection);

    localStorage.setItem('collection', collection);
    localStorage.setItem('lastId', this.contacts.lastId);
    localStorage.setItem('tags', tags);
  },
  retrieveData: function() {
    var collection = JSON.parse(localStorage.getItem('collection')),
        lastId = localStorage.getItem('lastId'),
        tags = JSON.parse(localStorage.getItem('tags'));

    if(lastId) {
      this.contacts.lastId = lastId;
      this.contacts.collection = collection;
    }

    if (this.contacts.collection.length > 0) {
      UI.displayContacts(this.contacts.collection);
    }

    if (tags) {
      tags.forEach(function(tagName) {
       UI.renderTagControl(tagName);
      });
    }
  }
}

$(function() {
  new Manager();
});

