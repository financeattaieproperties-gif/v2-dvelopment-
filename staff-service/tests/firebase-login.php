<?php
declare(strict_types=1);

// Isolated identity-provider boundary: no Google or database connection is made.
namespace Staff {
    function curl_init(string $url): object { return (object)['url'=>$url]; }
    function curl_setopt_array(object $curl, array $options): bool { return true; }
    function curl_exec(object $curl): string {
        return json_encode(str_contains($curl->url, 'metadata/x509')
            ? ['fixture-key'=>$GLOBALS['fixturePublicKey']]
            : ['users'=>[['localId'=>'fixture-agent','email'=>'agent@example.test','validSince'=>'0']]]);
    }
    function curl_getinfo(object $curl, int $option): int { return 200; }
    function curl_close(object $curl): void {}
}

namespace {
    require __DIR__.'/../src/App.php';

    final class LoginFixtureStatement extends PDOStatement {
        private array $parameters=[];
        public function __construct(private LoginFixtureDatabase $database, private string $sql) {}
        public function execute(?array $params=null): bool {
            $this->parameters=$params??[];
            $this->database->calls[]=[$this->sql,$this->parameters];
            return true;
        }
        public function fetchAll(int $mode=PDO::FETCH_DEFAULT, mixed ...$args): array {
            if (str_contains($this->sql,'SELECT attempts')) return [['attempts'=>1]];
            if (str_contains($this->sql,'SELECT * FROM core_users WHERE firebase_uid=')) {
                return $this->parameters[0] === ($this->database->row['firebase_uid']??null) ? [$this->database->row] : [];
            }
            if (str_contains($this->sql,'core_role_permissions')) return [['allowed'=>1]];
            if (str_contains($this->sql,'SELECT id, role, branch_id')) return $this->database->existing ? [$this->database->existing] : [];
            if (str_contains($this->sql,'core_departments')) return [['code'=>'sales']];
            if (str_contains($this->sql,'core_roles')) return [['department_code'=>'sales']];
            if (str_contains($this->sql,'core_branches')) return $this->database->branchActive ? [['id'=>1]] : [];
            return [];
        }
    }
    final class LoginFixtureDatabase extends PDO {
        public array $calls=[];
        public ?array $existing=null;
        public bool $branchActive=true;
        public array $row=['id'=>8,'firebase_uid'=>'fixture-agent','username'=>'agent@example.test','name'=>'Fixture Agent','role'=>'sales','branch_id'=>1,'active'=>1,'auth_version'=>1];
        public function __construct() {}
        public function prepare(string $query, array $options=[]): PDOStatement|false { return new LoginFixtureStatement($this,$query); }
        public function lastInsertId(?string $name=null): string|false { return '9'; }
    }

    $key=openssl_pkey_new(['private_key_bits'=>2048,'private_key_type'=>OPENSSL_KEYTYPE_RSA,'config'=>__DIR__.'/openssl.cnf']);
    $GLOBALS['fixturePublicKey']=openssl_pkey_get_details($key)['key'];
    $encode=fn(array $v)=>rtrim(strtr(base64_encode(json_encode($v)),'+/','-_'),'=');
    $now=time();
    $raw=$encode(['alg'=>'RS256','kid'=>'fixture-key']).'.'.$encode(['aud'=>'fixture-project','iss'=>'https://securetoken.google.com/fixture-project','sub'=>'fixture-agent','exp'=>$now+3600,'iat'=>$now-5,'auth_time'=>$now-10]);
    openssl_sign($raw,$signature,$key,OPENSSL_ALGO_SHA256);
    $token=$raw.'.'.rtrim(strtr(base64_encode($signature),'+/','-_'),'=');
    session_start();
    $reflection=new ReflectionClass(Staff\App::class);
    $app=$reflection->newInstanceWithoutConstructor();
    $database=new LoginFixtureDatabase();
    foreach (['db'=>$database,'config'=>['firebase_project_id'=>'fixture-project','firebase_api_key'=>'fixture-key'],'now'=>gmdate('Y-m-d H:i:s')] as $name=>$value) $reflection->getProperty($name)->setValue($app,$value);
    $checks=0;
    $check=function(bool $condition)use(&$checks):void { $checks++; if (!$condition) throw new RuntimeException('Firebase login assertion '.$checks.' failed.'); };
    $reject=function(callable $operation,int $status)use($check):void { try {$operation();}catch(Staff\HttpError $e){$check($e->status===$status);return;}throw new RuntimeException('Expected authentication rejection.'); };
    $login=$reflection->getMethod('login');
    $result=$login->invoke($app,['idToken'=>$token]);
    $check($result['user']['id']===8 && $_SESSION['user_id']===8);
    $check((bool)array_filter($database->calls,fn($call)=>str_contains($call[0],'WHERE firebase_uid=') && $call[1]===['fixture-agent']));
    $reject(fn()=>$login->invoke($app,['username'=>'agent@example.test','password'=>'local-password']),401);
    $check(empty($_SESSION['user_id']));
    $reject(fn()=>$login->invoke($app,['idToken'=>'malformed']),401);
    $database->row['active']=0;
    $reject(fn()=>$login->invoke($app,['idToken'=>$token]),403);
    $database->row['active']=1;
    $database->branchActive=false;
    $reject(fn()=>$login->invoke($app,['idToken'=>$token]),403);
    $database->branchActive=true;
    $database->row['firebase_uid']='different-uid';
    $reject(fn()=>$login->invoke($app,['idToken'=>$token]),403);
    $reflection->getProperty('user')->setValue($app,['id'=>1,'role'=>'ceo','branch_id'=>null]);
    $body=['name'=>'Fixture Staff','username'=>'staff@example.test','firebaseUid'=>'existing-firebase-uid','role'=>'sales','departmentCode'=>'sales','branchId'=>1];
    $result=$reflection->getMethod('createStaff')->invoke($app,$body);
    $check($result['id']===9);
    $writes=array_values(array_filter($database->calls,fn($call)=>str_starts_with($call[0],'INSERT INTO core_users')));
    $check(count($writes)===1 && in_array('existing-firebase-uid',$writes[0][1],true) && !str_contains($writes[0][0],'password_hash'));
    $create=$reflection->getMethod('createStaff');
    try { $create->invoke($app,array_merge($body,['password'=>'must-not-reach-storage'])); throw new RuntimeException('Password was accepted.'); }
    catch (InvalidArgumentException $e) { $check(true); }
    $database->existing=['id'=>9,'role'=>'sales','branch_id'=>1,'firebase_uid'=>'different-uid','username'=>'staff@example.test'];
    $reject(fn()=>$create->invoke($app,array_merge($body,['update'=>true])),409);
    $database->existing=array_merge($database->existing,['firebase_uid'=>'existing-firebase-uid','role'=>'ceo']);
    $reject(fn()=>$create->invoke($app,array_merge($body,['update'=>true])),403);
    $database->existing=null;
    $reflection->getProperty('user')->setValue($app,['id'=>1,'role'=>'manager','branch_id'=>2]);
    $reject(fn()=>$create->invoke($app,$body),403);
    $reject(fn()=>$login->invoke($app,['idToken'=>['invalid']]),401);
    echo "$checks Firebase login/provisioning assertions passed\n";
}
