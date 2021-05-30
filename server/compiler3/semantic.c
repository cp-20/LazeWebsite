#include <stdio.h>
#include <string.h>
#include "semantic.h"

struct expty expTy(Tr_exp exp, Ty_ty ty)
{
    struct expty e;
    e.exp = exp;
    e.ty = ty;
    return e;
}

static Ty_ty actual_ty(Ty_ty ty);
static Ty_tyList makeParamTypeList(S_table tenv, A_fieldList params);
static Ty_ty checkSymType(S_symbol sym);
static S_symbol returnSymFromType(Ty_ty);
static U_boolList makeEscapeList(A_fieldList list);
static T_type convertType(Ty_ty type);
static T_typeList convertAllType(Ty_tyList types);
static T_fundec initDrawPixelFunc(S_table venv)
{
    T_exp addr = T_BinOpExp(T_i64, T_add, T_BinOpExp(T_i64, T_mul, T_BinOpExp(T_i64, T_mul, T_GetLocalExp(T_i64, 0), T_ConstExp(T_i64, A_IntExp(0, 4))), T_ConstExp(T_i64, A_IntExp(0, 512))), T_BinOpExp(T_i64, T_mul, T_GetLocalExp(T_i64, 1), T_ConstExp(T_i64, A_IntExp(0, 4))));
    T_exp color = T_GetLocalExp(T_i64, 2);
    T_stm stm = T_StoreStm(addr, color);
    E_enventry draw = S_look(venv, S_Symbol("描画"));    
    return T_Fundec(convertAllType(draw -> u.func.formals), convertAllType(Ty_TyList(NULL, NULL)), T_none, stm, FALSE, draw -> u.func.index);
}

T_moduleList SEM_transProg(A_decList declist)
{
    T_moduleList list = checked_malloc(sizeof(*list));
    T_moduleList result = list;
    T_module mainFunc;
    S_table venv = E_base_fenv(), tenv = E_base_tenv();
    if(declist == NULL)
    {
        EM_error(0, "No code.");
    }
    A_decList decList = declist;
    E_enventry logEntry = S_look(venv, S_Symbol("出力"));
    T_fundec log = T_Fundec(convertAllType(logEntry -> u.func.formals), convertAllType(Ty_TyList(NULL, NULL)), T_none, NULL, FALSE, logEntry -> u.func.index);
    list -> head = T_ImportMod("console", "log", T_FuncMod(log));
    list -> tail = checked_malloc(sizeof(*list));
    list = list -> tail;
    list -> head = T_ImportMod("js", "mem", T_MemMod(16));
    list -> tail = checked_malloc(sizeof(*list));
    list = list -> tail;
    list -> head = T_FuncMod(initDrawPixelFunc(venv));
    list -> tail = checked_malloc(sizeof(*list));
    list = list -> tail;
    list -> head = NULL;
    list -> tail = NULL;
    for(;decList != NULL; decList = decList -> tail)
    {
        A_dec dec = decList -> head;
        if(dec == NULL)
        {
            continue;
        }
        T_module decMod = transDec(venv, tenv, dec, Tr_outermost());
        if(decMod)
        {
            if(decMod -> kind == T_func)
            {
                if(decMod -> u.func -> isMain)
                {
                    mainFunc = decMod;
                }
            }
            list -> head = decMod;
            list -> tail = checked_malloc(sizeof(*list));
            list = list -> tail;
            list -> head = NULL;
            list -> tail = NULL;
        }
    }
    list -> head = T_ExportMod("main", mainFunc);
    list -> tail = checked_malloc(sizeof(*list));
    list = list -> tail;
    list -> head = NULL;
    list -> tail = NULL;
    return result;
}

struct expty transStm(S_table venv, S_table tenv, A_stm stm, Tr_level level)
{
    switch(stm -> kind)
    {
        case A_compoundStm:
        {
            debug(stm -> pos, "Compound Statement");
            A_stmList stmlist;
            T_stmList list = checked_malloc(sizeof(*list));
            T_stmList result = list;
            list -> head = NULL;
            list -> tail = NULL;
            int i = 0;
            S_beginScope(venv);
            S_beginScope(tenv);
            for(i = 0, stmlist = stm -> u.compound; stmlist != NULL; stmlist = stmlist -> tail, i++)
            {
                if(stmlist -> head != NULL)
                {
                    A_stm stmHead = stmlist -> head;
                    // printf("%d", stmHead -> kind);
                    struct expty exp = transStm(venv, tenv, stmHead, level);
                    // printf("hey %d\n", exp.exp -> kind);
                    if(exp.exp -> kind == Tr_t_stm)
                    {
                        list -> head = exp.exp -> u.stm;
                        list -> tail = checked_malloc(sizeof(*list -> tail));
                        list = list -> tail;
                        list -> head = NULL;
                        list -> tail = NULL;
                    }
                }
            }
            S_endScope(venv);
            S_endScope(tenv);
            return expTy(Tr_CompoundStm(stm -> pos, result), Ty_Void());
            break;
        }
        case A_assignStm:
        {
            debug(stm -> pos, "Assign Statement");
            A_var var = stm -> u.assign.var;
            A_exp exp = stm -> u.assign.exp;
            E_enventry varType = S_look(venv, var->u.simple);
            struct expty assignVal = transExp(venv, tenv, exp, level);
            if(var -> u.simple != NULL)
            {
                debug(stm -> pos, "Var : %s %d", S_name(var -> u.simple), varType -> u.var.access -> access -> u.offset);
            }
            if(varType == NULL)
            {
                EM_error(stm -> pos, "%s is undefined.", S_name(var->u.simple));
            }
            if(varType-> u.var.ty != assignVal.ty)
            {
                EM_error(stm -> pos, "The type %s cannot be assigned to %s of type %d.", S_name(returnSymFromType(assignVal.ty)), S_name(var->u.simple), varType -> kind);
            }
            return expTy(Tr_AssignStm(stm -> pos, varType -> u.var.access, 
                    assignVal.exp -> u.exp), Ty_Void());
        }
        case A_declarationStm:
        {    
            debug(stm -> pos, "Declaration Statement");
            struct expty exp;
            // S_beginScope(venv);
            // S_beginScope(tenv);
            transDec(venv, tenv, stm -> u.declaration.dec, level);
            exp = transStm(venv, tenv, A_AssignStm(stm -> pos, stm -> u.declaration.dec -> u.var.var, stm -> u.declaration.dec -> u.var.init) , level);
            // S_endScope(venv);
            // S_beginScope(tenv);
            return exp;
            break;
        }
        case A_ifStm:
        {
            debug(stm -> pos, "If Statement");
            if(transExp(venv, tenv, stm -> u.iff.test, level).ty != Ty_Bool())
            {
                EM_error(stm -> pos, "If statement test expression must have a type of boolean.");
            }
            struct expty then = transStm(venv, tenv, stm -> u.iff.then, level);
            struct expty elsee = expTy(NULL, Ty_Void());
            if(stm -> u.iff.elsee != NULL)
            {
                elsee = transStm(venv, tenv, stm -> u.iff.elsee, level);
                return expTy(Tr_IfStm(stm -> pos, transExp(venv, tenv, stm -> u.iff.test, level).exp -> u.exp, 
                then.exp -> u.stm, elsee.exp -> u.stm), Ty_Void());
            }
            return expTy(Tr_IfStm(stm -> pos, transExp(venv, tenv, stm -> u.iff.test, level).exp -> u.exp, 
            then.exp -> u.stm, NULL), Ty_Void());
        }
        case A_whileStm:
        {
            debug(stm -> pos, "While Statement");
            struct expty body;
            if(transExp(venv, tenv, stm -> u.whilee.test, level).ty != Ty_Bool())
            {
                EM_error(stm -> pos, "While statement test expression must have a type of boolean.");
            }
            body = transStm(venv, tenv, stm -> u.whilee.body, level);
            return expTy(Tr_WhileStm(stm -> pos, transExp(venv, tenv, stm -> u.whilee.test, level).exp -> u.exp, 
            body.exp -> u.stm), Ty_Void());
        }
        case A_forStm:
        {
            debug(stm -> pos, "For Statement");
            A_stm assignStm = stm -> u.forr.assign;
            struct expty assign = transStm(venv, tenv, assignStm, level);
            struct expty condition = transExp(venv, tenv, stm -> u.forr.condition, level);
            if(condition.ty != Ty_Bool())
            {
                EM_error(stm -> pos, "For statement condition expression must have a type of boolean.");
            }
            struct expty increment = transStm(venv, tenv, stm -> u.forr.increment, level);
            struct expty body = transStm(venv, tenv, stm -> u.forr.body, level);
            // E_enventry assignVar = S_look(venv, assignExp -> u.assign.var -> u.simple);
            return expTy(Tr_ForStm(stm -> pos, assign.exp -> u.stm,
            condition.exp -> u.exp, increment.exp -> u.stm, body.exp -> u.stm), Ty_Void());
        }
        case A_breakStm:
        {
            debug(stm -> pos, "Break Statement");
            return expTy(Tr_BreakStm(stm -> pos, 1), Ty_Void());
        }
        case A_continueStm:
        {
            debug(stm -> pos, "Continue Statement");
            return expTy(Tr_ContinueStm(stm -> pos), Ty_Void());
        }
        case A_callStm:
        {
            T_expList expList = checked_malloc(sizeof(*expList));
            T_expList result = expList;
            debug(stm -> pos, "Call Statement");
            E_enventry entry = S_look(venv, stm -> u.call.func);
            if(entry != NULL && entry -> kind == E_funcentry)
            {
                A_expList expArgs;
                Ty_tyList entryArgsTy;
                
                int i = 1;
                for(i = 1, expArgs = stm -> u.call.args, entryArgsTy = entry -> u.func.formals; expArgs != NULL && entryArgsTy != NULL;
                             expArgs = expArgs -> tail, entryArgsTy = entryArgsTy -> tail, i++)
                {
                    A_exp exp = expArgs -> head;
                    expList -> head = transExp(venv, tenv, exp, level).exp -> u.exp;
                    expList -> tail = checked_malloc(sizeof(*expList));
                    expList = expList -> tail;
                    Ty_ty type = entryArgsTy -> head;
                    if(exp != NULL && type != NULL)
                    {
                        struct expty argType = transExp(venv, tenv, exp, level);
                        if(actual_ty(type) != actual_ty(argType.ty))
                        {
                            EM_error(stm -> pos, "Type of argument %d does not match with type \'%s\'.", i, S_name(returnSymFromType(actual_ty(type))));
                        }
                    }
                    else
                    {
                        if(exp == NULL && type != NULL)
                        {
                            EM_error(stm -> pos, "There are too few arguments in the call statement.");
                            break;
                        }
                        else if(exp != NULL && type == NULL)
                        {
                            EM_error(stm -> pos, "There are too many arguments in the call statement.");
                            break;
                        }
                    }
                    expList -> head = NULL;
                    expList -> tail = NULL;
                }
                
                if(expArgs == NULL && entryArgsTy != NULL)
                {
                    if(entryArgsTy -> head != NULL)
                    {
                        EM_error(stm -> pos, "There are too few arguments in the call statement.");
                    }
                }
                else if(expArgs != NULL && entryArgsTy == NULL)
                {
                    if(expArgs -> head != NULL)
                    {
                        EM_error(stm -> pos, "There are too many arguments in the call statement.");
                    }
                }
                return expTy(Tr_CallStm(stm -> pos, entry -> u.func.index, S_name(entry -> u.func.label), result), entry -> u.func.result);
            }
            else
            {
                EM_error(stm -> pos, "Undefined function \'%s\'", S_name(stm -> u.call.func));
            }
            return expTy(Tr_CallStm(stm -> pos, entry -> u.func.index, S_name(entry -> u.func.label), expList), Ty_Void());
        }
        case A_returnStm:
        {
            debug(stm -> pos, "Return Statement");
            return expTy(Tr_ReturnStm(stm -> pos, transExp(venv, tenv, stm -> u.returnn.ret, level).exp -> u.exp), Ty_Void());
        }
    }
}

struct expty transVar(S_table venv, S_table tenv, A_var v, Tr_level level)
{
    switch(v -> kind)
    {
        case A_simpleVar:
        {
            E_enventry x = S_look(venv, v -> u.simple);
            if(x && x -> kind == E_varentry)
            {
                if(x -> u.var.access -> level -> parent)
                    return expTy(Tr_VarExp(v -> pos, convertType(x -> u.var.ty), x -> u.var.access, FALSE), actual_ty(x -> u.var.ty));
                else
                    return expTy(Tr_VarExp(v -> pos, convertType(x -> u.var.ty), x -> u.var.access, TRUE), actual_ty(x -> u.var.ty));
            }
            else if(!x)
            {
                EM_error(v -> pos, "It doesn't exist");
            }
            else if(x -> kind != E_varentry)
            {
                EM_error(v -> pos, "It is not a variable. %s", S_name(x -> u.var.ty -> u.name.sym));
            }
            else
            {
                EM_error(v -> pos, "undefined variable %s", S_name(v -> u.simple));
                return expTy(NULL, Ty_Int());
            }
            break;
        }
       case A_fieldVar:
       {
           break;
       }
       case A_subscriptVar:
       {
           break;
       }
    }
}

struct expty transExp(S_table venv, S_table tenv, A_exp e, Tr_level level)
{
    switch(e -> kind)
    {
        case A_intExp:
        {
            return expTy(Tr_IntExp(e -> pos, e -> u.intt), Ty_Int());
            break;
        }
        case A_stringExp:
        {
            // printf("string");
            return expTy(NULL, Ty_String());
            break;
        }
        case A_realExp:
        {
            return expTy(Tr_RealExp(e -> pos, e -> u.real), Ty_Real());
            break;
        }
        case A_boolExp:
        {
            return expTy(Tr_BoolExp(e -> pos, e -> u.booll), Ty_Bool());
            break;
        }
        case A_nilExp:
        {
            return expTy(Tr_NilExp(e -> pos), Ty_Nil());
            break;
        }
        case A_varExp:
        {
            return transVar(venv, tenv, e -> u.var, level);
            break;
        }
        case A_callExp:
        {
            E_enventry entry = S_look(venv, e -> u.call.func);
            T_expList expList = checked_malloc(sizeof(*expList));
            T_expList result = expList;
            if(entry != NULL && entry -> kind == E_funcentry)
            {
                A_expList expArgs;
                Ty_tyList entryArgsTy;
                int i = 1;
                for(i = 1, expArgs = e -> u.call.args, entryArgsTy = entry -> u.func.formals; expArgs != NULL && entryArgsTy != NULL;
                             expArgs = expArgs -> tail, entryArgsTy = entryArgsTy -> tail, i++)
                {
                    A_exp exp = expArgs -> head;
                    expList -> head = transExp(venv, tenv, exp, level).exp -> u.exp;
                    expList -> tail = checked_malloc(sizeof(*expList));
                    expList = expList -> tail;
                    Ty_ty type = entryArgsTy -> head;
                    if(exp != NULL && type != NULL)
                    {
                        struct expty argType = transExp(venv, tenv, exp, level);
                        if(actual_ty(type) != actual_ty(argType.ty))
                        {
                            debug(e -> pos, "%d", actual_ty(type) -> kind);
                            EM_error(e -> pos, "Type of argument %d does not match with type \'%s\'.", i, S_name(returnSymFromType(actual_ty(type))));
                        }
                    }
                    else
                    {
                        if(exp == NULL && type != NULL)
                        {
                            EM_error(e -> pos, "There are too few arguments in the call expression.");
                            break;
                        }
                        else if(exp != NULL && type == NULL)
                        {
                            EM_error(e -> pos, "There are too many arguments in the call expression.");
                            break;
                        }
                    }
                    expList -> tail= NULL;
                    expList -> head = NULL;
                }
                
                if(expArgs == NULL && entryArgsTy != NULL)
                {
                    if(entryArgsTy -> head != NULL)
                    {
                        EM_error(e -> pos, "There are too many arguments in the call expression.");
                    }
                }
                else if(expArgs != NULL && entryArgsTy == NULL)
                {
                    if(expArgs -> head != NULL)
                    {
                        EM_error(e -> pos, "There are too few arguments in the call expression.");
                    }
                }
                return expTy(Tr_CallExp(e -> pos, convertType(entry -> u.func.result), 
                entry -> u.func.index, S_name(entry -> u.func.label), result), entry -> u.func.result);
            }
            else
            {
                EM_error(e -> pos, "Undefined function \'%s\'", S_name(e -> u.call.func));
            }
        }
        case A_recordExp:
        {
            return expTy(NULL, S_look(tenv, e -> u.record.typ));
        }
        case A_assignExp:
        {
            A_var var = e -> u.assign.var;
            A_exp exp = e -> u.assign.exp;
            E_enventry varType = S_look(venv, var -> u.simple);
            struct expty expp = transExp(venv, tenv, exp, level);
            if(varType -> u.var.ty != expp.ty)
            {
                EM_error(e -> pos, "Cannot assign %s to %s.", S_name(expp.ty -> u.name.sym), returnSymFromType(varType -> u.var.ty));
            }
            return expTy(expp.exp, transExp(venv, tenv, exp, level).ty);
        }
        case A_ifExp:
        {
            struct expty test = transExp(venv, tenv, e -> u.iff.test, level);
            struct expty then = transExp(venv, tenv, e -> u.iff.then, level);
            struct expty elsee = transExp(venv, tenv, e -> u.iff.elsee, level);
            if(then.ty != Ty_Bool())
            {
                EM_error(e -> pos, "Test expression needs to be a bool type.");
            }
            if(then.ty != elsee.ty)
            {
                EM_error(e -> pos, "Then expression and else expression must be of the same type.");
            }
            return expTy(Tr_IfExp(e -> pos, convertType(then.ty), test.exp -> u.exp, then.exp -> u.exp, elsee.exp -> u.exp), actual_ty(transExp(venv, tenv, e -> u.iff.then, level).ty));
        }
        case A_opExp:
        {
            A_oper oper = e -> u.op.oper;
            struct expty left = transExp(venv, tenv, e -> u.op.left, level);
            struct expty right = transExp(venv, tenv, e -> u.op.right, level);
            if(oper == A_plusOp)
            {
                if(left.ty != NULL && right.ty != NULL)
                {
                    if(left.ty->kind == Ty_int && right.ty -> kind == Ty_int)
                        return expTy(Tr_OpExp(e -> pos, convertType(left.ty), T_add, left.exp -> u.exp, right.exp -> u.exp), Ty_Int());
                    if(left.ty -> kind == Ty_real && right.ty -> kind == Ty_int)
                        return expTy(Tr_OpExp(e -> pos, convertType(left.ty), T_add, left.exp -> u.exp, T_ConvertExp(T_f64, right.exp -> u.exp)), Ty_Real());
                    if(left.ty -> kind == Ty_int && right.ty -> kind == Ty_real)
                        return expTy(Tr_OpExp(e -> pos, convertType(left.ty), T_add, T_ConvertExp(T_f64, left.exp -> u.exp), right.exp -> u.exp), Ty_Real());
                    if(left.ty -> kind == Ty_real && right.ty -> kind == Ty_real)
                        return expTy(Tr_OpExp(e -> pos, convertType(left.ty), T_add, left.exp -> u.exp, right.exp -> u.exp), Ty_Real());
                    if(left.ty -> kind == Ty_string && right.ty -> kind == Ty_string)
                        return expTy(Tr_OpExp(e -> pos, convertType(left.ty), T_add, left.exp -> u.exp, right.exp -> u.exp), Ty_String());
                    else
                        EM_error(e -> u.op.left -> pos, "The two operands cannot be added.");
                }
                else 
                {
                    if(left.ty == NULL && right.ty != NULL)
                        EM_error(e -> pos, "Left operand does not have a type.");
                    else if(left.ty != NULL && right.ty == NULL)
                        EM_error(e -> pos, "Right operand does not have a type.");
                    if(left.ty == NULL && right.ty == NULL)
                        EM_error(e -> pos, "Both operand do not have a type.");
                }
            }
            if(oper == A_minusOp)
            {
                if(left.ty != NULL && right.ty != NULL)
                {
                    if(left.ty->kind == Ty_int && right.ty -> kind == Ty_int)
                        return expTy(Tr_OpExp(e -> pos, convertType(left.ty), T_sub, left.exp -> u.exp, right.exp -> u.exp), Ty_Int());
                    if(left.ty -> kind == Ty_real && right.ty -> kind == Ty_int)
                        return expTy(Tr_OpExp(e -> pos, convertType(left.ty), T_sub, left.exp -> u.exp, T_ConvertExp(T_f64, right.exp -> u.exp)), Ty_Real());
                    if(left.ty -> kind == Ty_int && right.ty -> kind == Ty_real)
                        return expTy(Tr_OpExp(e -> pos, convertType(left.ty), T_sub, T_ConvertExp(T_f64, left.exp -> u.exp), right.exp -> u.exp), Ty_Real());
                    if(left.ty -> kind == Ty_real && right.ty -> kind == Ty_real)
                        return expTy(Tr_OpExp(e -> pos, convertType(left.ty), T_sub, left.exp -> u.exp, right.exp -> u.exp), Ty_Real());
                    if(left.ty -> kind == Ty_string && right.ty -> kind == Ty_string)
                        return expTy(Tr_OpExp(e -> pos, convertType(left.ty), T_sub, left.exp -> u.exp, right.exp -> u.exp), Ty_String());
                    else
                        EM_error(e -> u.op.left -> pos, "The two operands cannot be subtracted.");
                }
                else 
                {
                    if(left.ty == NULL && right.ty != NULL)
                        EM_error(e -> pos, "Left operand does not have a type.");
                    else if(left.ty != NULL && right.ty == NULL)
                        EM_error(e -> pos, "Right operand does not have a type.");
                    if(left.ty == NULL && right.ty == NULL)
                        EM_error(e -> pos, "Both operand do not have a type.");
                }
            }
            if(oper == A_timesOp)
            {
                if(left.ty != NULL && right.ty != NULL)
                {
                    if(left.ty->kind == Ty_int && right.ty -> kind == Ty_int)
                        return expTy(Tr_OpExp(e -> pos, convertType(left.ty), T_mul, left.exp -> u.exp, right.exp -> u.exp), Ty_Int());
                    if(left.ty -> kind == Ty_real && right.ty -> kind == Ty_int)
                        return expTy(Tr_OpExp(e -> pos, convertType(left.ty), T_mul, left.exp -> u.exp, T_ConvertExp(T_f64, right.exp -> u.exp)), Ty_Real());
                    if(left.ty -> kind == Ty_int && right.ty -> kind == Ty_real)
                        return expTy(Tr_OpExp(e -> pos, convertType(Ty_Real()), T_mul, T_ConvertExp(T_f64, left.exp -> u.exp), right.exp -> u.exp), Ty_Real());
                    if(left.ty -> kind == Ty_real && right.ty -> kind == Ty_real)
                        return expTy(Tr_OpExp(e -> pos, convertType(left.ty), T_mul, left.exp -> u.exp, right.exp -> u.exp), Ty_Real());
                    if(left.ty -> kind == Ty_string && right.ty -> kind == Ty_string)
                        return expTy(Tr_OpExp(e -> pos, convertType(left.ty), T_mul, left.exp -> u.exp, right.exp -> u.exp), Ty_String());
                    else
                        EM_error(e -> u.op.left -> pos, "The two operands cannot be multiplied.");
                }
                else 
                {
                    if(left.ty == NULL && right.ty != NULL)
                        EM_error(e -> pos, "Left operand does not have a type.");
                    else if(left.ty != NULL && right.ty == NULL)
                        EM_error(e -> pos, "Right operand does not have a type.");
                    if(left.ty == NULL && right.ty == NULL)
                        EM_error(e -> pos, "Both operand do not have a type.");
                }
            }
            if(oper == A_divideOp)
            {
                if(left.ty != NULL && right.ty != NULL)
                {
                    if(left.ty->kind == Ty_int && right.ty -> kind == Ty_int)
                        return expTy(Tr_OpExp(e -> pos, convertType(left.ty), T_div_s, left.exp -> u.exp, right.exp -> u.exp), Ty_Int());
                    if(left.ty -> kind == Ty_real && right.ty -> kind == Ty_int)
                        return expTy(Tr_OpExp(e -> pos, convertType(left.ty), T_div_s, left.exp -> u.exp, T_ConvertExp(T_f64, right.exp -> u.exp)), Ty_Real());
                    if(left.ty -> kind == Ty_int && right.ty -> kind == Ty_real)
                        return expTy(Tr_OpExp(e -> pos, convertType(left.ty), T_div_s, T_ConvertExp(T_f64, left.exp -> u.exp), right.exp -> u.exp), Ty_Real());
                    if(left.ty -> kind == Ty_real && right.ty -> kind == Ty_real)
                        return expTy(Tr_OpExp(e -> pos, convertType(left.ty), T_div_s, left.exp -> u.exp, right.exp -> u.exp), Ty_Real());
                    if(left.ty -> kind == Ty_string && right.ty -> kind == Ty_string)
                        return expTy(Tr_OpExp(e -> pos, convertType(left.ty), T_div_s, left.exp -> u.exp, right.exp -> u.exp), Ty_String());
                    else
                    {
                        EM_error(e -> u.op.left -> pos, "The two operands cannot be divided.");
                        return expTy(NULL, NULL);
                    }
                }
                else 
                {
                    if(left.ty == NULL && right.ty != NULL)
                        EM_error(e -> pos, "Left operand does not have a type.");
                    else if(left.ty != NULL && right.ty == NULL)
                        EM_error(e -> pos, "Right operand does not have a type.");
                    if(left.ty == NULL && right.ty == NULL)
                        EM_error(e -> pos, "Both operand do not have a type.");
                }
            }
            if(oper == A_eqOp)
            {
                if(left.ty != NULL && right.ty != NULL)
                {
                    if(left.ty -> kind != right.ty -> kind)
                        EM_error(e -> u.op.left -> pos, "The two operands cannot be compared.");
                    return expTy(Tr_OpExp(e -> pos, convertType(left.ty), T_eq, left.exp -> u.exp, right.exp -> u.exp), Ty_Bool());
                }
                else 
                {
                    if(left.ty == NULL && right.ty != NULL)
                        EM_error(e -> pos, "Left operand does not have a type.");
                    else if(left.ty != NULL && right.ty == NULL)
                        EM_error(e -> pos, "Right operand does not have a type.");
                    if(left.ty == NULL && right.ty == NULL)
                        EM_error(e -> pos, "Both operand do not have a type.");
                }
            }
            if(oper == A_neqOp)
            {
                if(left.ty != NULL && right.ty != NULL)
                {
                    if(left.ty -> kind != right.ty -> kind)
                        EM_error(e -> u.op.left -> pos, "The two operands cannot be compared.");
                    return expTy(Tr_OpExp(e -> pos, convertType(left.ty), T_ne, left.exp -> u.exp, right.exp -> u.exp), Ty_Bool());
                }
                else 
                {
                    if(left.ty == NULL && right.ty != NULL)
                        EM_error(e -> pos, "Left operand does not have a type.");
                    else if(left.ty != NULL && right.ty == NULL)
                        EM_error(e -> pos, "Right operand does not have a type.");
                    if(left.ty == NULL && right.ty == NULL)
                        EM_error(e -> pos, "Both operand do not have a type.");
                }
            }
            if(oper == A_leOp)
            {
                if(left.ty != NULL && right.ty != NULL)
                {
                    if(left.ty -> kind != right.ty -> kind)
                        EM_error(e -> u.op.left -> pos, "The two operands cannot be compared.");
                    return expTy(Tr_OpExp(e -> pos, convertType(left.ty), T_le_s, left.exp -> u.exp, right.exp -> u.exp), Ty_Bool());
                }
                else 
                {
                    if(left.ty == NULL && right.ty != NULL)
                        EM_error(e -> pos, "Left operand does not have a type.");
                    else if(left.ty != NULL && right.ty == NULL)
                        EM_error(e -> pos, "Right operand does not have a type.");
                    if(left.ty == NULL && right.ty == NULL)
                        EM_error(e -> pos, "Both operand do not have a type.");
                }
            }
            if(oper == A_ltOp)
            {
                if(left.ty != NULL && right.ty != NULL)
                {
                    if(left.ty -> kind != right.ty -> kind)
                        EM_error(e -> u.op.left -> pos, "The two operands cannot be compared.");
                    return expTy(Tr_OpExp(e -> pos, convertType(left.ty), T_lt_s, left.exp -> u.exp, right.exp -> u.exp), Ty_Bool());
                }
                else 
                {
                    if(left.ty == NULL && right.ty != NULL)
                        EM_error(e -> pos, "Left operand does not have a type.");
                    else if(left.ty != NULL && right.ty == NULL)
                        EM_error(e -> pos, "Right operand does not have a type.");
                    if(left.ty == NULL && right.ty == NULL)
                        EM_error(e -> pos, "Both operand do not have a type.");
                }
            }
            if(oper == A_geOp)
            {
                if(left.ty != NULL && right.ty != NULL)
                {
                    if(left.ty -> kind != right.ty -> kind)
                        EM_error(e -> u.op.left -> pos, "The two operands cannot be compared.");
                    return expTy(Tr_OpExp(e -> pos, convertType(left.ty), T_ge_s, left.exp -> u.exp, right.exp -> u.exp), Ty_Bool());
                }
                else 
                {
                    if(left.ty == NULL && right.ty != NULL)
                        EM_error(e -> pos, "Left operand does not have a type.");
                    else if(left.ty != NULL && right.ty == NULL)
                        EM_error(e -> pos, "Right operand does not have a type.");
                    if(left.ty == NULL && right.ty == NULL)
                        EM_error(e -> pos, "Both operand do not have a type.");
                }
            }
            if(oper == A_gtOp)
            {
                if(left.ty != NULL && right.ty != NULL)
                {
                    if(left.ty -> kind != right.ty -> kind)
                        EM_error(e -> u.op.left -> pos, "The two operands cannot be compared.");
                    return expTy(Tr_OpExp(e -> pos, convertType(left.ty), T_gt_s, left.exp -> u.exp, right.exp -> u.exp), Ty_Bool());
                }
                else 
                {
                    if(left.ty == NULL && right.ty != NULL)
                        EM_error(e -> pos, "Left operand does not have a type.");
                    else if(left.ty != NULL && right.ty == NULL)
                        EM_error(e -> pos, "Right operand does not have a type.");
                    if(left.ty == NULL && right.ty == NULL)
                        EM_error(e -> pos, "Both operand do not have a type.");
                }
            }
            if(oper == A_andOp)
            {
                if(left.ty -> kind != Ty_bool)
                {
                    EM_error(e -> pos, "Left operand does not a bool type.");
                }
                if(right.ty -> kind != Ty_bool)
                {
                    EM_error(e -> pos, "Right operand does not a bool type.");
                }
                return expTy(Tr_OpExp(e -> pos, convertType(left.ty), T_and, left.exp -> u.exp, right.exp -> u.exp), Ty_Bool());
            }
            if(oper == A_orOp)
            {
                if(left.ty -> kind != Ty_bool)
                {
                    EM_error(e -> pos, "Left operand does not a bool type.");
                }
                if(right.ty -> kind != Ty_bool)
                {
                    EM_error(e -> pos, "Right operand does not a bool type.");
                }
                return expTy(Tr_OpExp(e -> pos, convertType(left.ty), T_or, left.exp -> u.exp, right.exp -> u.exp), Ty_Bool());
            }
            if(oper == A_modOp)
            {
                if(left.ty != NULL && right.ty != NULL)
                {
                    if(left.ty->kind == Ty_int && right.ty -> kind == Ty_int)
                        return expTy(Tr_OpExp(e -> pos, convertType(left.ty), T_rem_s, left.exp -> u.exp, right.exp -> u.exp), Ty_Int());
                    else
                    {
                        EM_error(e -> u.op.left -> pos, "The two operands cannot be divided.");
                        return expTy(NULL, NULL);
                    }
                }
                else 
                {
                    if(left.ty == NULL && right.ty != NULL)
                        EM_error(e -> pos, "Left operand does not have a type.");
                    else if(left.ty != NULL && right.ty == NULL)
                        EM_error(e -> pos, "Right operand does not have a type.");
                    if(left.ty == NULL && right.ty == NULL)
                        EM_error(e -> pos, "Both operand do not have a type.");
                }
            }
            break;
        }
    }
}

T_module transDec(S_table venv, S_table tenv, A_dec d, Tr_level level)
{
    switch(d -> kind)
    {
        case A_varDec:
        {
            struct expty exp;
            E_enventry varEntry = S_look(venv, d -> u.var.var -> u.simple);
            E_enventry typeEntry = S_look(tenv, d -> u.var.var -> u.simple);
            if(varEntry != NULL)
            {
                debug(d -> pos, "Variable or function of name %s is already declared.", S_name(d -> u.var.var -> u.simple));
            }
            if(typeEntry != NULL)
            {
                EM_error(d -> pos, "Type of name %s is already declared.", S_name(d -> u.var.var -> u.simple));
            }
            if(d -> u.var.init != NULL)
            {
                exp = transExp(venv, tenv, d -> u.var.init, level);
                if(actual_ty(checkSymType(d -> u.var.typ)) != actual_ty(exp.ty)) 
                {
                    EM_error(d -> pos, "Cannot initialize variable of type \'%s\' with \'%s\'.", S_name(d -> u.var.typ), S_name(returnSymFromType(exp.ty)));
                }
                debug(d -> pos, "Variable declared with value.\n");
                S_enter(venv, d -> u.var.var -> u.simple, E_VarEntry(Tr_allocLocal(level, ESC_checkEscapeFromType(exp.ty), exp.ty), exp.ty));
            }
            else if(d -> u.var.init == NULL)
            {
                debug(d -> pos, "Variable declared.\n");
                S_enter(venv, d -> u.var.var -> u.simple, E_VarEntry(Tr_allocLocal(level, ESC_checkEscapeFromType(checkSymType(d -> u.var.typ)), checkSymType(d -> u.var.typ)), checkSymType(d -> u.var.typ)));
            }
            if(!(level -> parent))
            {
                return T_GlobalMod(convertType(checkSymType(d -> u.var.typ)), transExp(venv, tenv, d -> u.var.init, level).exp -> u.exp);
            }
            return NULL;
            break;
        }
        case A_functionDec:
        {
            debug(d -> pos, "Function declared.");
            A_fundec func = d -> u.function -> head;
            Ty_tyList paramTypes = makeParamTypeList(tenv, func -> params);
            Tr_level newLevel = Tr_newLevel(level, func -> name, makeEscapeList(func -> params), paramTypes);
            Ty_ty resultType = checkSymType(func -> result);
            T_typeList newTypeList = checked_malloc(sizeof(*newTypeList));
            T_typeList result = newTypeList;
            E_enventry entry =  E_FuncEntry(level, func -> name, paramTypes, resultType);
            S_enter(venv, func -> name, entry);
            S_beginScope(venv);
            {
                A_fieldList list;
                Ty_tyList typeList;
                Tr_accessList accessList;
                for(accessList = newLevel -> formals -> tail, list = func -> params, typeList = paramTypes; list != NULL && typeList != NULL && 
                    accessList != NULL; list = list -> tail, typeList = typeList -> tail, accessList = accessList -> tail)
                {
                    newTypeList -> head = convertType(typeList -> head);
                    newTypeList -> tail = checked_malloc(sizeof(*newTypeList));
                    newTypeList = newTypeList -> tail;
                    newTypeList -> head = T_none;
                    newTypeList -> tail = NULL;
                    list -> head -> escape = ESC_checkEscapeFromType(typeList -> head);
                    if(typeList -> head != NULL)
                        S_enter(venv, list -> head -> name, E_VarEntry(accessList -> head, typeList -> head));
                }
                struct expty body;
                if(func -> body != NULL)
                {
                    body = transStm(venv, tenv, func->body, newLevel);
                }
                S_endScope(venv);
                
                T_typeList typeListt = convertAllType(newLevel -> frame -> localsType);
                bool isMain = (strcmp(S_name(d -> u.function -> head -> name),"実行") == 0);
                return T_FuncMod(T_Fundec(result, typeListt, convertType(checkSymType(d -> u.function -> head -> result)), 
                body.exp -> u.stm, isMain, entry -> u.func.index));
                break;
            }
        }
        case A_typeDec:
        {
            S_enter(tenv, d -> u.type -> head -> name, transTy(tenv, d -> u.type -> head -> ty));
            break;
        }
    }
}

Ty_ty transTy (S_table tenv, A_ty ty)
{
    switch(ty -> kind)
    {
        case A_nameTy:
        {
            Ty_ty type;
            if(type = checkSymType(ty -> u.name))
            {
                return type;
            }
            else
            {
                type = S_look(tenv, ty -> u.name);
                if(!type)
                {
                    return Ty_Name(ty -> u.name, NULL);
                }
                return type;
            }
        }
    }
}

static Ty_ty actual_ty(Ty_ty ty)
{
    if(ty ->kind == Ty_name)
    {
        return actual_ty(ty -> u.name.ty);
    }
    return ty;
}

static Ty_tyList makeParamTypeList(S_table tenv, A_fieldList params)
{
    if(params == NULL)
    {
        return NULL;
    }
    Ty_tyList typeList = Ty_TyList(NULL, NULL);
    //make typeList_head point to typeList
    Ty_tyList typeList_head = typeList;
    S_symbol sym;
    Ty_ty ty;
    for(;params != NULL; params = params -> tail)
    {
        sym = params -> head -> typ; 
        if(ty = checkSymType(sym))
        {
            typeList -> head = ty;
        }
        else
        {
            ty = S_look(tenv, sym);
            if(ty != NULL)
            {
                typeList -> head = ty;
            }
            else
            {
                EM_error(params -> head -> pos, "Undefined Type: %s", S_name(sym));
            }
        }
        typeList-> tail = Ty_TyList(NULL, NULL);
        typeList -> head = ty;
        typeList = typeList -> tail;
        typeList -> tail = NULL;
        typeList -> head = NULL;
    }
    
    return typeList_head;
}

static Ty_ty checkSymType(S_symbol sym)
{
    if(sym == S_Symbol("int"))
    {
        return Ty_Int();
    }
    else if(sym == S_Symbol("string"))
    {
        return Ty_String();
    }
    else if(sym == S_Symbol("real"))
    {
        return Ty_Real();
    }
    else if(sym == S_Symbol("bool"))
    {
        return Ty_Bool();
    }
    else if(sym == S_Symbol("void"))
    {
        return Ty_Void();
    }
    else
    {
        return NULL;
    }
}

static S_symbol returnSymFromType(Ty_ty type)
{
    if(type -> kind == Ty_nil)
    {
        return S_Symbol("null");
    }
    else if(type -> kind == Ty_int)
    {
        return S_Symbol("int");
    }
    else if(type -> kind == Ty_real)
    {
        return S_Symbol("real");
    }
    else if(type -> kind == Ty_bool)
    {
        return S_Symbol("bool");
    }
    else if(type -> kind == Ty_string)
    {
        return S_Symbol("string");
    }
    else if(type -> kind == Ty_void)
    {
        return S_Symbol("void");
    }
    else if(type -> kind == Ty_name)
    {
        return type -> u.name.sym;
    }
}
static U_boolList makeEscapeList(A_fieldList params)
{
    U_boolList list = checked_malloc(sizeof(*list));
    U_boolList retValue = list;
    for(;params; params = params -> tail)
    {
        list -> head = params -> head -> escape;
        list -> tail = checked_malloc(sizeof(*list -> tail));
        list = list -> tail;
        list -> tail = NULL;
        list -> head = T_none;
    }
    
    return retValue;
}
static T_type convertType(Ty_ty type)
{
    T_type result = T_i64;
    switch(type -> kind)
    {
        case Ty_record:
        {
            EM_error(0, "Records not supported right now.");
        }
        case Ty_nil:
        {
            result = T_i32;
            break;
        }
        case Ty_int:
        {
            result = T_i64;
            break;
        }
        case Ty_string:
        {
            EM_error(0, "Strings not supported right now.");
        }
        case Ty_array:
        {
            EM_error(0, "Arrays not supported right now.");
        }
        case Ty_void:
        {
            result = T_none;
            break;
        }
        case Ty_real:
        {
            result = T_f64;
            break;
        }
        case Ty_bool:
        {
            result = T_i32;
            break;
        }
        case Ty_name:
        {
            if(type -> u.name.sym == S_Symbol("int"))
            {
                result = T_i64;
                break;
            }
            else if(type -> u.name.sym == S_Symbol("real"))
            {
                result = T_f64;
                break;
            }
            else
            {
                EM_error(0, "Name variables not supported right now.");
            }
        }
    }
    return result;
}
static T_typeList convertAllType(Ty_tyList types)
{
    T_typeList list = checked_malloc(sizeof(*list));
    T_typeList result = list;
    for(;types -> tail; types = types -> tail)
    {
        list -> head = convertType(types -> head);
        list -> tail = checked_malloc(sizeof(*list));
        list = list -> tail;
        list -> head = T_none;
        list -> tail = NULL;
    }
    return result;
}