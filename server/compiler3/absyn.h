#pragma once
#include "symbol.h"

typedef int A_pos;

typedef struct A_block_ *A_block;
typedef struct A_stm_ *A_stm;
typedef struct A_var_ *A_var;
typedef struct A_exp_ *A_exp;
typedef struct A_dec_ *A_dec;
typedef struct A_ty_ *A_ty;

typedef struct A_decList_ *A_decList;
typedef struct A_expList_ *A_expList;
typedef struct A_stmList_ *A_stmList;
typedef struct A_field_ *A_field;
typedef struct A_fieldList_ *A_fieldList;
typedef struct A_fundec_ *A_fundec;
typedef struct A_fundecList_ *A_fundecList;
typedef struct A_namety_ *A_namety;
typedef struct A_nametyList_ *A_nametyList;
typedef struct A_efield_ *A_efield;
typedef struct A_efieldList_ *A_efieldList;

typedef enum 
{
    A_plusOp, A_minusOp, A_timesOp, A_divideOp, A_modOp, 
    A_eqOp, A_neqOp, A_ltOp, A_leOp, A_gtOp, A_geOp, A_andOp, A_orOp
} A_oper;

struct A_stm_
{
    enum
    {
        A_compoundStm, A_assignStm, A_declarationStm, A_ifStm, A_whileStm, A_forStm, A_breakStm, 
        A_continueStm, A_callStm, A_returnStm
    } kind;
    A_pos pos;
    union
    {
        A_stmList compound;
        struct {A_var var; A_exp exp;} assign;
        struct {A_dec dec;} declaration;
        struct {A_exp test; A_stm then, elsee;} iff;
        struct {A_exp test; A_stm body;} whilee;
        struct {A_stm assign; A_exp condition; A_stm increment; A_stm body;} forr;
        struct {S_symbol func; A_expList args;} call;
        struct {A_exp ret;} returnn;
    } u;
};

struct A_var_
{
    enum 
    {
        A_simpleVar, A_fieldVar, A_subscriptVar
    } kind;
    A_pos pos;
	union 
    {
        S_symbol simple;
	    struct 
        {
            A_var var;
		    S_symbol sym;
        } field;
	    struct 
        {
            S_symbol name;
		    A_exp exp;
        } subscript;
	} u;
};

struct A_exp_
{
    enum 
    {
        A_varExp, A_nilExp, A_intExp, A_stringExp, A_callExp,
	    A_opExp, A_recordExp, A_seqExp, A_assignExp, A_ifExp,
	    A_arrayExp, A_realExp, A_boolExp
    } kind;
    A_pos pos;
    union 
    {
        A_var var;
	    /* nil; - needs only the pos */
	    long long intt;
	    string stringg;
        double real;
        bool booll;
	    struct {S_symbol func; A_expList args;} call;
	    struct {A_oper oper; A_exp left; A_exp right;} op;
	    struct {S_symbol typ; A_efieldList fields;} record;
	    A_expList seq;
	    struct {A_var var; A_exp exp;} assign;
	    struct {A_exp test, then, elsee;} iff; /* elsee is optional */
	    struct {A_exp test, body;} whilee;
	    struct {S_symbol var; A_exp lo,hi,body; bool escape;} forr;
	    /* breakk; - need only the pos */
	    struct {S_symbol typ; A_exp size, init;} array;
    } u;
};

struct A_dec_ 
{
    enum 
    {
        A_functionDec, A_varDec, A_typeDec
    } kind;
    A_pos pos;
    union 
    {
        A_fundecList function;
	    /* escape may change after the initial declaration */
	    struct {A_var var; S_symbol typ; A_exp init; bool escape;} var;
	    A_nametyList type;
	} u;
   };

struct A_ty_ 
{
    enum 
    {
        A_nameTy, A_recordTy, A_arrayTy
    } kind;
	A_pos pos;
	union
    {
        S_symbol name;
		A_fieldList record;
		S_symbol array;
	} u;
};

/* Linked lists and nodes of lists */

struct A_field_ {S_symbol name, typ; A_pos pos; bool escape;};
struct A_fieldList_ {A_field head; A_fieldList tail;};
struct A_expList_ {A_exp head; A_expList tail;};
struct A_stmList_ {A_stm head; A_stmList tail;};
struct A_fundec_ {A_pos pos;
                 S_symbol name; A_fieldList params; 
		 S_symbol result; A_stm body;};

struct A_fundecList_ {A_fundec head; A_fundecList tail;};
struct A_decList_ {A_dec head; A_decList tail;};
struct A_namety_ {S_symbol name; A_ty ty;};
struct A_nametyList_ {A_namety head; A_nametyList tail;};
struct A_efield_ {S_symbol name; A_exp exp;};
struct A_efieldList_ {A_efield head; A_efieldList tail;};


/* Function Prototypes */
A_stm A_AssignStm(A_pos pos, A_var var, A_exp exp);
A_stm A_IfStm(A_pos pos, A_exp test, A_stm then, A_stm elsee);
A_stm A_WhileStm(A_pos pos, A_exp test, A_stm body);
A_stm A_ForStm(A_pos pos, A_stm assign, A_exp condition, A_stm increment, A_stm body);
A_stm A_BreakStm(A_pos pos);
A_stm A_ContinueStm(A_pos pos);
A_stm A_CompoundStm(A_pos pos, A_stmList stmlist);
A_stm A_DeclarationStm(A_pos pos, A_dec dec);
A_stm A_CallStm(A_pos pos, S_symbol func, A_expList args);
A_stm A_ReturnStm(A_pos pos, A_exp exp);

A_var A_SimpleVar(A_pos pos, S_symbol sym);
A_var A_FieldVar(A_pos pos, A_var var, S_symbol sym);
A_var A_SubscriptVar(A_pos pos, A_var var, A_exp exp);


A_exp A_VarExp(A_pos pos, A_var var);
A_exp A_NilExp(A_pos pos);
A_exp A_IntExp(A_pos pos, long long i);
A_exp A_StringExp(A_pos pos, string s);
A_exp A_RealExp(A_pos pos, double f);
A_exp A_BoolExp(A_pos pos, bool b);
A_exp A_CallExp(A_pos pos, S_symbol func, A_expList args);
A_exp A_OpExp(A_pos pos, A_oper oper, A_exp left, A_exp right);
A_exp A_RecordExp(A_pos pos, S_symbol typ, A_efieldList fields);
A_exp A_SeqExp(A_pos pos, A_expList seq);
A_exp A_AssignExp(A_pos pos, A_var var, A_exp exp);
A_exp A_IfExp(A_pos pos, A_exp test, A_exp then, A_exp elsee);
// A_exp A_WhileExp(A_pos pos, A_exp test, A_exp body);
// A_exp A_ForExp(A_pos pos, S_symbol var, A_exp lo, A_exp hi, A_exp body);
// A_exp A_BreakExp(A_pos pos);
// A_exp A_ContinueExp(A_pos pos);
A_exp A_ArrayExp(A_pos pos, S_symbol typ, A_exp size, A_exp init);


A_dec A_FunctionDec(A_pos pos, A_fundecList function);
A_dec A_VarDec(A_pos pos, A_stm assign, S_symbol typ);
A_dec A_TypeDec(A_pos pos, A_nametyList type);


A_ty A_NameTy(A_pos pos, S_symbol name);
A_ty A_RecordTy(A_pos pos, A_fieldList record);
A_ty A_ArrayTy(A_pos pos, S_symbol array);
A_field A_Field(A_pos pos, S_symbol name, S_symbol typ);
A_fieldList A_FieldList(A_field head, A_fieldList tail);
A_expList A_ExpList(A_exp head, A_expList tail);
A_stmList A_StmList(A_stm head, A_stmList tail);
A_fundec A_Fundec(A_pos pos, S_symbol name, A_fieldList params, S_symbol result, A_stm body);
A_fundecList A_FundecList(A_fundec head, A_fundecList tail);
A_decList A_DecList(A_dec head, A_decList tail);
A_namety A_Namety(S_symbol name, A_ty ty);
A_nametyList A_NametyList(A_namety head, A_nametyList tail);
A_efield A_Efield(S_symbol name, A_exp exp);
A_efieldList A_EfieldList(A_efield head, A_efieldList tail); 
