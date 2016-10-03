<?php

//
// Roundcube Responses Plugin
//

class responses extends rcube_plugin {

    // client environment variables, push/pull
    private static $allowed_names = array(
    );
    
    // client environment variables, push only
    private static $environ_names = array(
        'activate_plugin',
        'enable_logging',
        // 'enable_inject',
        // 'template_mapa',
    );
    
    private $rc; // controller singleton

	public $task = 'mail|settings';
	
	function init() {
        $this->rc = rcmail::get_instance();
        $task = $this->rc->task; $action = $this->rc->action;

        if ($task == 'mail' && $this->is_root_request()) {
            if($action == 'compose' && $this->is_html_request()) {
                $this->init_config();
                $this->template_inject();
                $this->init_mail_html_page();
                return;
            }
            return;
        }

        if ($task == 'settings') {
            $this->init_config();
            $this->template_reset();
            $this->template_inject();
            
            //$this->log(print_r($this->rc->get_compose_responses(),true));
            // TODO
            return;
        }
                    	
	}
	
    // root vs frame window request
    function is_root_request() {
        return empty($_REQUEST['_framed']);
    }
	
    // html vs ajax request
    function is_html_request() {
        return $this->rc->output->type == 'html';
    }

    // plugin name space
    function key($name) {
        return 'plugin.responses.' . $name; // keep in sync with *.js
    }
    
    // plugin server logger
    function log($line, $force = false) {
        if($this->config_get('enable_logging') || $force){
            $file = $this->key('log');
            $func = debug_backtrace()[1]['function'];
            $text = $func . ' : ' . $line;
            rcube::write_log($file, $text);
        }
    }

    // setup config with default override
    function init_config() {
        $this->add_hook('config_get', array($this, 'hook_config_get'));
        $this->provide_default();
    }
    
    // load plugin default configuration file
    function provide_default($name = 'default.inc.php') {
        $config = null;
        $path = $this->home . '/' . $name;
        if ($path && is_file($path) && is_readable($path)) {
            ob_start();
            include($path);
            ob_end_clean();
        }
        if (is_array($config)) {
            $this->config_default = $config;
        }
    }
    
    // inject plugin default configuration
    function hook_config_get($args){
        $name = $args['name'];
        $result = $args['result'];
        $default = $this->config_default[$name];
        if(! isset($result) && isset($default)) {
            $args['result'] = $default;
        }
        return $args;
    }
    
    // 
    function init_mail_html_page() {
        $this->add_texts('localization', true);
        $this->include_script('responses.js');
        $this->provide_client_env_var();
    }

    // client environment variables
    function set_env($name, $value = null) {
        $key = $this->key($name);
        if(! isset($value)) {
            $value = $this->config_get($name);
        }
        $this->rc->output->set_env($key, $value);
    }
    
    // load plugin preferences
    function config_get($name) {
        $key = $this->key($name); 
        return $this->rc->config->get($key);
    }
    
    // save plugin preferences
    function config_put($name, $value) {
        $key = $this->key($name);
        $this->rc->user->save_prefs(array($key => $value));
    }

    // client environment variables
    function provide_client_env_var() {
        $name_list = array_merge(
            self::$allowed_names, self::$environ_names
        );
        foreach($name_list as $name) {
           $this->set_env($name);
        }
    }

    // remove all templates 
    function template_reset() {
        $memento_reset = $this->config_get('memento_reset');
        if($memento_reset) {
            $this->log('...');
            $this->config_put('memento_reset', false);
            $mapa_name = 'compose_responses'; 
            $response_mapa = array(); // erase
            $this->rc->user->save_prefs(array($mapa_name => array_values($response_mapa)));
        }
    }
    
    // ensure plugin templates
    // see rcmail.php rcmail.get_compose_responses()
    function template_inject() {
        $enable_inject = $this->config_get('enable_inject');
        $this->log('enable: ' . ($enable_inject ? 'true' : 'false'));
        if(! $enable_inject){
            return;
        }
        $config = $this->rc->config;
        $inject_static = $this->config_get('inject_static');
        $mapa_type = $inject_static ? 'core-pref' : 'user-pref';
        $mapa_name = $inject_static ? 'compose_responses_static' : 'compose_responses'; 
        $response_mapa = $config->get($mapa_name); // rcmail provided
        $template_mapa = $this->config_get('template_mapa'); // plugin provided
        foreach($template_mapa as $template) {
            $found = false;
            // XXX: name is response identity
            $name = $mapa_type . '/' . $template['name'];
            $key = substr(md5($name), 0, 16); // see see rcmail.php
            $template['key'] = $key; 
            foreach($response_mapa as $response) {
                if($template['key'] === $response['key']) {
                    $found = true;
                    break;
                }
            }
            $entry = $name. ' (key=' . $key . ')';
            if($found) {
                $this->log('exists: ' . $entry);
            } else {
                $this->log('inject: ' . $entry);
                $response_mapa[] = $template;
                if($inject_static){
                    // override rcmail
                    $config->set($mapa_name, $response_mapa); 
                } else {
                    // persist per user
                    $this->rc->user->save_prefs(array($mapa_name => array_values($response_mapa)));
                }
            }
        }
    }

}

?>
