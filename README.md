Roundcube Responses Plugin
==========================

Technical plugin name is [responses][responses_link].

| Plugin help template      | 
|:-------------------------:|
| ![][plugin_settings_help] |

Plugin provides variable substitution in the compose response templates
by injecting fields derived from the composed mail headers (from, to, cc),
and thus can make mail messages more personal.

Plugin also adds support for html-based response templates.

For example, assuming the following compose message headers:
```
from: "thomas cube" <thomas.cube@mailer.net>
to:   "machniak, aleksander" <aleks@example.com>
```

this sample template with variables:
```
    {to_head}, hello.
    
    Thank you,
    {from_head}.
    
    --
    {from_full} <{from_mail}>
```

will produce the following result after insert:
```
    Aleksander, hello.
    
    Thank you,
    Thomas.
    
    --
    Thomas Cube <thomas.cube@mailer.net>
```

Manual Install
--------------
Installation can be done in two steps:
providing resources and activating configuration.

1) Provision plugin resources.
For example, for [roundcube on archlinux][roundcube_arch]:
```
cd /usr/share/webapps/roundcubemail/plugins

rm -r -f responses
git clone https://github.com/random-cuber/responses.git responses
```

2) Activate plugin in `roundcube` configuration.
For example, for [roundcube on archlinux][roundcube_arch]:
```
cat /etc/webapps/roundcubemail/config/config.inc.php

$config['plugins'] = array(
    'responses',   // plugin proper
);
```

Settings
--------

Navigate to:
```
// to change plugin features:
Settings -> Preferences -> Composing Messages -> Responses

// to manage response templates:
Settings -> Responses -> ...
```

Menu entries:
* `TODO` : TODO

Operation
---------

Prepare templates using available plugin variables.

[roundcube_arch]: https://wiki.archlinux.org/index.php/Roundcube
[responses_link]: http://plugins.roundcube.net/packages/random-cuber/responses
[plugin_settings_help]:  https://raw.githubusercontent.com/random-cuber/responses/master/build/plugin_settings_help.png
