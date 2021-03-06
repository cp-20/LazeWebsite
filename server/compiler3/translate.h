#pragma once
#include "util.h"
#include "frame.h"
#include "wasm_frame.h"
#include "temp.h"
#include "escape.h"
#include "tree.h"

typedef struct Tr_exp_ *Tr_exp;

typedef enum {Tr_t_stm, Tr_t_exp, Tr_t_fundec, Tr_t_module} Tr_expType;

struct Tr_exp_
{
    Tr_expType kind;
    union
    {
        T_stm stm;
        T_exp exp;
        T_fundec fundec;
        T_module module;
    } u;
};

// Tr_exp Tr_ExpStm(Tr_)

typedef struct Tr_access_ *Tr_access;
typedef struct Tr_level_ *Tr_level;
typedef struct Tr_accessList_ *Tr_accessList;
Tr_accessList Tr_AccessList(Tr_access head, Tr_accessList tail);

struct Tr_access_
{
    Tr_level level;
    F_access access;
};

struct Tr_accessList_
{
    Tr_access head;
    Tr_accessList tail;
};

struct Tr_level_
{
    Tr_level parent;
    Temp_label label;
    F_frame frame;
    Tr_accessList formals;
};

Tr_level Tr_outermost(void);
Tr_level Tr_newLevel(Tr_level parent, Temp_label name, U_boolList formals, Ty_tyList params);
Tr_accessList Tr_formals(Tr_level level);
Tr_access Tr_allocLocal(Tr_level level, bool escape, Ty_ty type);

Tr_exp Tr_AssignStm(A_pos pos, Tr_access access, T_exp exp);
Tr_exp Tr_IfStm(A_pos pos, T_exp test, T_stm then, T_stm elsee);
Tr_exp Tr_WhileStm(A_pos pos, T_exp test, T_stm body);
Tr_exp Tr_ForStm(A_pos pos, T_stm assign, T_exp condition, T_stm increment, T_stm body);
Tr_exp Tr_BreakStm(A_pos pos, int depth);
Tr_exp Tr_ContinueStm(A_pos pos);
Tr_exp Tr_CompoundStm(A_pos pos, T_stmList stmlist);
// Tr_exp Tr_DeclarationStm(A_pos pos, A_dec dec);
Tr_exp Tr_CallStm(A_pos pos, int index, string func, T_expList args);
Tr_exp Tr_ReturnStm(A_pos pos, T_exp exp);

Tr_exp Tr_VarExp(A_pos pos, T_type type, Tr_access access, bool isGlobal);
Tr_exp Tr_NilExp(A_pos pos);
Tr_exp Tr_IntExp(A_pos pos, int i);
// Tr_exp Tr_StringExp(A_pos pos, string s);
Tr_exp Tr_RealExp(A_pos pos, double f);
Tr_exp Tr_BoolExp(A_pos pos, bool b);
Tr_exp Tr_CallExp(A_pos pos, T_type type, int index, string func, T_expList args);
Tr_exp Tr_OpExp(A_pos pos, T_type type, T_binOp oper, T_exp left, T_exp right);
Tr_exp Tr_RecordExp(A_pos pos, S_symbol typ, A_efieldList fields);
Tr_exp Tr_SeqExp(A_pos pos, A_expList seq);
Tr_exp Tr_AssignExp(A_pos pos, A_var var, A_exp exp);
Tr_exp Tr_IfExp(A_pos pos, T_type type, T_exp test, T_exp then, T_exp elsee);
Tr_exp Tr_ArrayExp(A_pos pos, S_symbol typ, A_exp size, A_exp init);


Tr_exp Tr_FunctionDec(A_pos pos, T_typeList params, T_typeList locals, T_type result, T_stm body, bool isMain, int index);
// A_dec A_TypeDec(A_pos pos, A_nametyList type);